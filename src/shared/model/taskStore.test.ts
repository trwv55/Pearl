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

const payload = (overrides: Partial<Parameters<TaskStore["createOptimistic"]>[1]> = {}) => ({
	title: "Новая",
	comment: "",
	date: TEST_DATE,
	emoji: "🆕",
	isMain: false,
	markerColor: "#000000",
	time: null,
	...overrides,
});

describe("createOptimistic", () => {
	it("сразу кладёт задачу в кэш своей даты и планирует уведомление", () => {
		const id = store.createOptimistic(USER, payload({ date: OTHER_DATE, time: 600 }));

		expect(id).toBe("task-1");
		expect(store.tasks).toEqual([]); // выбрана TEST_DATE, задача на OTHER_DATE
		expect(ids(store.getTasksForDate(OTHER_DATE))).toEqual(["task-1"]);
		expect(scheduleTaskNotification).toHaveBeenCalledWith(expect.objectContaining({ id: "task-1", time: 600 }));
		expect(mockTaskApi.addTaskWithId).toHaveBeenCalledWith(USER, "task-1", expect.objectContaining({ title: "Новая" }), 0);
	});

	it("order = max среди задач того же типа + 1, NO_ORDER игнорируется", async () => {
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([
			makeRoutine({ order: 4 }),
			makeRoutine({ order: NO_ORDER }),
			makeMain({ order: 9 }),
		]);
		await store.fetchTasks(USER, TEST_DATE);

		store.createOptimistic(USER, payload({ isMain: false }));
		expect(store.getTasksForDate(TEST_DATE)[0].order).toBe(5);
	});

	it("ошибка API → задача убрана, уведомление отменено, error-тост", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		failNext("addTaskWithId");

		const id = store.createOptimistic(USER, payload());
		expect(ids(store.tasks)).toEqual([id]);

		await flushPromises();

		expect(store.tasks).toEqual([]);
		expect(cancelTaskNotification).toHaveBeenCalledWith(id);
		expect(showErrorToast).toHaveBeenCalledTimes(1);
	});
});

describe("updateOptimistic", () => {
	it("заменяет задачу на месте, сохраняя позицию", async () => {
		const a = makeTask({ title: "A" });
		const b = makeTask({ title: "B" });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([a, b]);
		await store.fetchTasks(USER, TEST_DATE);

		store.updateOptimistic(USER, b, { title: "B2" });

		expect(store.tasks.map((t) => t.title)).toEqual(["A", "B2"]);
		expect(mockTaskApi.updateTask).toHaveBeenCalledWith(USER, b.id, { title: "B2" });
	});

	it("перенос на другую дату: уходит из старого кэша, появляется в новом", async () => {
		const task = makeTask({ date: TEST_DATE });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([task]);
		await store.fetchTasks(USER, TEST_DATE);

		store.updateOptimistic(USER, task, { date: OTHER_DATE });

		expect(store.tasks).toEqual([]);
		expect(ids(store.getTasksForDate(OTHER_DATE))).toEqual([task.id]);
		expect(cancelTaskNotification).toHaveBeenCalledWith(task.id);
		expect(scheduleTaskNotification).toHaveBeenLastCalledWith(expect.objectContaining({ id: task.id, date: OTHER_DATE }));
	});

	it("ошибка API → откат, включая обратный перенос даты", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		const task = makeTask({ date: TEST_DATE, title: "Старое" });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([task]);
		await store.fetchTasks(USER, TEST_DATE);
		failNext("updateTask");

		store.updateOptimistic(USER, task, { date: OTHER_DATE, title: "Новое" });
		await flushPromises();

		expect(store.tasks.map((t) => t.title)).toEqual(["Старое"]);
		expect(store.getTasksForDate(OTHER_DATE)).toEqual([]);
		expect(scheduleTaskNotification).toHaveBeenLastCalledWith(expect.objectContaining({ title: "Старое" }));
		expect(showErrorToast).toHaveBeenCalledTimes(1);
	});
});

describe("reorderOptimistic", () => {
	it("проставляет order по индексу и шлёт батч", async () => {
		const a = makeRoutine({ order: 0 });
		const b = makeRoutine({ order: 1 });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([a, b]);
		await store.fetchTasks(USER, TEST_DATE);

		store.reorderOptimistic(USER, [b, a]);

		expect(store.routineTasks.map((t) => t.id)).toEqual([b.id, a.id]);
		expect(mockTaskApi.updateTasksOrder).toHaveBeenCalledWith(USER, [
			{ id: b.id, order: 0 },
			{ id: a.id, order: 1 },
		]);
	});

	it("пустой список — noop", () => {
		store.reorderOptimistic(USER, []);
		expect(mockTaskApi.updateTasksOrder).not.toHaveBeenCalled();
	});

	it("ошибка API → прежний порядок восстановлен, тост", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		const a = makeRoutine({ order: 0 });
		const b = makeRoutine({ order: 1 });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([a, b]);
		await store.fetchTasks(USER, TEST_DATE);
		failNext("updateTasksOrder");

		store.reorderOptimistic(USER, [b, a]);
		await flushPromises();

		expect(store.routineTasks.map((t) => t.id)).toEqual([a.id, b.id]);
		expect(showErrorToast).toHaveBeenCalledTimes(1);
	});
});

describe("toggleCompletion", () => {
	it("выставляет completedAt и отменяет уведомление; повторно — снимает и планирует", async () => {
		const task = makeTask({ time: 600 });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([task]);
		await store.fetchTasks(USER, TEST_DATE);

		await store.toggleCompletion(USER, task.id);
		expect(store.tasks[0].isCompleted).toBe(true);
		expect(store.tasks[0].completedAt).toBeInstanceOf(Date);
		expect(cancelTaskNotification).toHaveBeenCalledWith(task.id);

		await store.toggleCompletion(USER, task.id);
		expect(store.tasks[0].isCompleted).toBe(false);
		expect(store.tasks[0].completedAt).toBeNull();
		expect(scheduleTaskNotification).toHaveBeenLastCalledWith(expect.objectContaining({ id: task.id, isCompleted: false }));
	});

	it("апдейт привязан к дате задачи: смена дня во время запроса не теряет галочку", async () => {
		const task = makeTask({ date: TEST_DATE });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([task]);
		await store.fetchTasks(USER, TEST_DATE);

		let resolve!: () => void;
		mockTaskApi.toggleTaskCompletion.mockReturnValueOnce(new Promise<Task>((r) => (resolve = () => r({} as Task))));

		const pending = store.toggleCompletion(USER, task.id);
		store.setSelectedDate(OTHER_DATE);
		resolve();
		await pending;

		store.setSelectedDate(TEST_DATE);
		expect(store.tasks[0].isCompleted).toBe(true);
	});

	it("ошибка API → откат статуса и уведомления, тост", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		const task = makeTask({ time: 600 });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([task]);
		await store.fetchTasks(USER, TEST_DATE);
		failNext("toggleTaskCompletion");

		await store.toggleCompletion(USER, task.id);

		expect(store.tasks[0].isCompleted).toBe(false);
		expect(scheduleTaskNotification).toHaveBeenLastCalledWith(
			expect.objectContaining({ id: task.id, isCompleted: false }),
		);
		expect(showErrorToast).toHaveBeenCalledTimes(1);
	});

	it("неизвестный id — резолвится без обращения к API", async () => {
		await expect(store.toggleCompletion(USER, "nope")).resolves.toBeUndefined();
		expect(mockTaskApi.toggleTaskCompletion).not.toHaveBeenCalled();
	});
});

describe("computed", () => {
	it("mainTasks / routineTasks фильтруют по типу и сортируют по order", async () => {
		const m2 = makeMain({ order: 2 });
		const m1 = makeMain({ order: 1 });
		const r1 = makeRoutine({ order: 0 });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([m2, r1, m1]);
		await store.fetchTasks(USER, TEST_DATE);

		expect(store.mainTasks.map((t) => t.id)).toEqual([m1.id, m2.id]);
		expect(store.routineTasks.map((t) => t.id)).toEqual([r1.id]);
	});
});

describe("deleteWithUndo", () => {
	const setHidden = (hidden: boolean) =>
		Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });

	const undoOf = () => vi.mocked(showUndoToast).mock.calls[0][0].onUndo!;

	let task: Task;

	beforeEach(async () => {
		vi.useFakeTimers();
		task = makeTask({ time: 600 });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([task]);
		await store.fetchTasks(USER, TEST_DATE);
	});

	it("задача исчезает сразу, по таймеру уходит в API, onDeleted вызван", async () => {
		const onDeleted = vi.fn();
		store.deleteWithUndo(USER, task, 4000, onDeleted);

		expect(store.tasks).toEqual([]);
		expect(cancelTaskNotification).toHaveBeenCalledWith(task.id);
		expect(mockTaskApi.deleteTask).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(4000);

		expect(mockTaskApi.deleteTask).toHaveBeenCalledWith(USER, task.id);
		expect(onDeleted).toHaveBeenCalledTimes(1);
	});

	it("«Отменить» до таймера — задача возвращается, API не вызван, уведомление восстановлено", async () => {
		store.deleteWithUndo(USER, task);
		undoOf()();

		expect(ids(store.tasks)).toEqual([task.id]);
		expect(scheduleTaskNotification).toHaveBeenLastCalledWith(expect.objectContaining({ id: task.id }));

		await vi.advanceTimersByTimeAsync(4000);
		expect(mockTaskApi.deleteTask).not.toHaveBeenCalled();
	});

	it("повторный вызов для той же задачи — noop", () => {
		store.deleteWithUndo(USER, task);
		store.deleteWithUndo(USER, task);
		expect(showUndoToast).toHaveBeenCalledTimes(1);
	});

	it("ошибка удаления → задача возвращается, тост", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		failNext("deleteTask");
		store.deleteWithUndo(USER, task);

		await vi.advanceTimersByTimeAsync(4000);

		expect(ids(store.tasks)).toEqual([task.id]);
		expect(showErrorToast).toHaveBeenCalledTimes(1);
	});

	it("flushPendingDeletes коммитит немедленно, таймер потом не срабатывает второй раз", async () => {
		store.deleteWithUndo(USER, task);
		store.flushPendingDeletes();
		// advanceTimersByTimeAsync(0), а не runAllTimersAsync: если flushPendingDeletes
		// сломать (сделать no-op), исходный 4-секундный таймер останется висеть, и
		// runAllTimersAsync всё равно его докрутит — тест перестанет отличать
		// «отработал flush» от «просто исполнился обычный таймер». advanceTimersByTimeAsync(0)
		// продвигает только микрозадачи, не трогая ещё не наступившие таймеры.
		await vi.advanceTimersByTimeAsync(0);

		expect(mockTaskApi.deleteTask).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(4000);
		expect(mockTaskApi.deleteTask).toHaveBeenCalledTimes(1);
	});

	it("уход приложения в фон (visibilitychange + hidden) коммитит отложенные удаления", async () => {
		store.deleteWithUndo(USER, task);

		setHidden(true);
		document.dispatchEvent(new Event("visibilitychange"));
		// Та же логика, что и в тесте на flushPendingDeletes: runAllTimersAsync
		// докрутил бы и обычный 4-секундный таймер, даже если обработчик
		// visibilitychange сломан, — тест бы не отличил раннее срабатывание.
		await vi.advanceTimersByTimeAsync(0);
		setHidden(false);

		expect(mockTaskApi.deleteTask).toHaveBeenCalledWith(USER, task.id);
	});
});
