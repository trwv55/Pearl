import { beforeEach, describe, expect, it, vi } from "vitest";
import { addDays } from "date-fns";
import { TaskStore } from "@/shared/model/taskStore";
import { makeMain, makeRoutine, makeTask, TEST_DATE } from "@/shared/testing/factories";
import { flushPromises } from "@/shared/testing/async";
import {
	emitSnapshot,
	emitSubscriptionError,
	failNext,
	mockTaskApi,
	unsubscribeMock,
} from "@/shared/testing/mocks/taskApi";
import { NO_ORDER, type Task } from "@/shared/types/task";
import { showErrorToast } from "@/shared/lib/showToast";
import { showUndoToast } from "@/shared/lib/showUndoToast";
import { cancelTaskNotification, scheduleTaskNotification } from "@/shared/lib/notifications";

vi.mock("@/shared/api/taskApi", async () => (await import("@/shared/testing/mocks/taskApi")).mockTaskApi);
vi.mock("@/shared/lib/notifications", () => ({
	scheduleTaskNotification: vi.fn(async () => {}),
	cancelTaskNotification: vi.fn(async () => {}),
}));
vi.mock("@/shared/lib/showToast", () => ({
	showErrorToast: vi.fn(),
	showSuccessToast: vi.fn(),
}));
vi.mock("@/shared/lib/showUndoToast", () => ({
	showUndoToast: vi.fn(),
}));

const USER = "u1";
const OTHER_DATE = addDays(TEST_DATE, 1);
const ids = (tasks: Task[]) => tasks.map((t) => t.id);

let store: TaskStore;

beforeEach(() => {
	store = new TaskStore();
	store.setSelectedDate(TEST_DATE);
});

describe("кэш и выбранная дата", () => {
	it("setSelectedDate берёт задачи из кэша или даёт пустой список", async () => {
		const task = makeTask({ date: TEST_DATE });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([task]);
		await store.fetchTasks(USER, TEST_DATE);

		store.setSelectedDate(OTHER_DATE);
		expect(store.tasks).toEqual([]);

		store.setSelectedDate(TEST_DATE);
		expect(ids(store.tasks)).toEqual([task.id]);
	});

	it("hasTasksForDate ложно для пустого, но загруженного дня; isDateLoaded — истинно", async () => {
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([]);
		await store.fetchTasks(USER, TEST_DATE);

		expect(store.isDateLoaded(TEST_DATE)).toBe(true);
		expect(store.hasTasksForDate(TEST_DATE)).toBe(false);
		expect(store.isDateLoaded(OTHER_DATE)).toBe(false);
	});

	it("clearCache очищает кэш и текущий список", async () => {
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([makeTask()]);
		await store.fetchTasks(USER, TEST_DATE);

		store.clearCache();
		expect(store.tasks).toEqual([]);
		expect(store.isDateLoaded(TEST_DATE)).toBe(false);
	});
});

describe("fetchTasks", () => {
	it("кладёт задачи в кэш даты и обновляет tasks только для выбранной даты", async () => {
		const other = makeTask({ date: OTHER_DATE });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([other]);
		await store.fetchTasks(USER, OTHER_DATE);

		expect(store.tasks).toEqual([]);
		expect(ids(store.getTasksForDate(OTHER_DATE))).toEqual([other.id]);
	});

	it("ошибка API — состояние не меняется", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		failNext("getTasksByDate");
		await store.fetchTasks(USER, TEST_DATE);

		expect(store.isDateLoaded(TEST_DATE)).toBe(false);
		expect(store.tasks).toEqual([]);
	});
});

describe("fetchTasksForRange", () => {
	it("помечает загруженными все дни диапазона, включая пустые", async () => {
		const start = TEST_DATE;
		const end = addDays(TEST_DATE, 2);
		const mid = makeTask({ date: addDays(TEST_DATE, 1) });
		mockTaskApi.getTasksForRange.mockResolvedValueOnce([mid]);

		await store.fetchTasksForRange(USER, start, end);

		expect(store.isDateLoaded(start)).toBe(true);
		expect(store.isDateLoaded(addDays(start, 1))).toBe(true);
		expect(store.isDateLoaded(end)).toBe(true);
		expect(store.isDateLoaded(addDays(end, 1))).toBe(false);
		expect(ids(store.getTasksForDate(addDays(start, 1)))).toEqual([mid.id]);
	});

	it("обновляет tasks, если выбранная дата в диапазоне", async () => {
		const task = makeTask({ date: TEST_DATE });
		mockTaskApi.getTasksForRange.mockResolvedValueOnce([task]);
		await store.fetchTasksForRange(USER, addDays(TEST_DATE, -1), addDays(TEST_DATE, 1));
		expect(ids(store.tasks)).toEqual([task.id]);
	});
});

describe("ensureTasksForDate", () => {
	it("не дублирует запрос при параллельном вызове и не ходит за загруженной датой", async () => {
		let resolve!: (tasks: Task[]) => void;
		mockTaskApi.getTasksByDate.mockReturnValueOnce(new Promise<Task[]>((r) => (resolve = r)));

		const p1 = store.ensureTasksForDate(USER, TEST_DATE);
		const p2 = store.ensureTasksForDate(USER, TEST_DATE);
		expect(mockTaskApi.getTasksByDate).toHaveBeenCalledTimes(1);

		resolve([]);
		await Promise.all([p1, p2]);
		expect(store.isDateLoaded(TEST_DATE)).toBe(true);

		await store.ensureTasksForDate(USER, TEST_DATE);
		expect(mockTaskApi.getTasksByDate).toHaveBeenCalledTimes(1);
	});
});

describe("subscribeToRange", () => {
	it("раскладывает снапшот по датам и обновляет выбранную", () => {
		const a = makeTask({ date: TEST_DATE });
		const b = makeTask({ date: OTHER_DATE });
		store.subscribeToRange(USER, TEST_DATE, OTHER_DATE);

		emitSnapshot([a, b]);

		expect(ids(store.tasks)).toEqual([a.id]);
		expect(ids(store.getTasksForDate(OTHER_DATE))).toEqual([b.id]);
		expect(store.isDateLoaded(OTHER_DATE)).toBe(true);
	});

	it("onReady вызывается один раз — на первом снапшоте", () => {
		const onReady = vi.fn();
		store.subscribeToRange(USER, TEST_DATE, OTHER_DATE, onReady);

		emitSnapshot([]);
		emitSnapshot([]);
		expect(onReady).toHaveBeenCalledTimes(1);
	});

	it("onReady вызывается и при ошибке подписки", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		const onReady = vi.fn();
		store.subscribeToRange(USER, TEST_DATE, OTHER_DATE, onReady);

		emitSubscriptionError(new Error("permission-denied"));
		expect(onReady).toHaveBeenCalledTimes(1);
	});

	it("игнорирует задачи, ожидающие удаления (окно undo)", () => {
		vi.useFakeTimers();
		const task = makeTask({ date: TEST_DATE });
		store.subscribeToRange(USER, TEST_DATE, OTHER_DATE);
		emitSnapshot([task]);

		store.deleteWithUndo(USER, task);
		emitSnapshot([task]); // сервер ещё «видит» задачу

		expect(store.tasks).toEqual([]);
	});

	it("возвращает функцию отписки из API", () => {
		expect(store.subscribeToRange(USER, TEST_DATE, OTHER_DATE)).toBe(unsubscribeMock);
	});
});
