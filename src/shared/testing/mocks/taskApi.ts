import { vi, type Mock } from "vitest";
import type { Task } from "@/shared/types/task";

type Subscription = {
	onTasks: (tasks: Task[]) => void;
	onError: (error: Error) => void;
};

let idCounter = 0;
let subscription: Subscription | null = null;

export const unsubscribeMock = vi.fn();

// Дефолтные реализации всех функций мока — единственный источник правды.
// И начальное объявление mockTaskApi, и resetTaskApiMock берут их из одной
// фабрики, чтобы не дублировать дефолты в двух местах.
function createDefaultImpls() {
	return {
		generateTaskId: (_userId: string) => `task-${++idCounter}`,
		addTaskWithId: async () => {},
		addTask: async () => `task-${++idCounter}`,
		mapDocToTask: (_id: string, _data: unknown) => undefined as unknown as Task,
		getTasksByDate: async (): Promise<Task[]> => [],
		getTasksForRange: async (): Promise<Task[]> => [],
		subscribeToTasksInRange: (
			_userId: string,
			_startDate: Date,
			_endDate: Date,
			onTasks: Subscription["onTasks"],
			onError: Subscription["onError"],
		) => {
			subscription = { onTasks, onError };
			return unsubscribeMock;
		},
		deleteTask: async () => {},
		updateTasksOrder: async () => {},
		rolloverTasks: async () => {},
		getTaskById: async () => null,
		updateTask: async () => {},
		toggleTaskCompletion: async () => ({}) as Task,
	};
}

const defaultImpls = createDefaultImpls();

// Полный мок @/shared/api/taskApi: все функции — vi.fn с «успешной» реализацией
// по умолчанию. Подключается в тестах через
//   vi.mock("@/shared/api/taskApi", async () => (await import("@/shared/testing/mocks/taskApi")).mockTaskApi);
export const mockTaskApi = {
	generateTaskId: vi.fn(defaultImpls.generateTaskId),
	addTaskWithId: vi.fn(defaultImpls.addTaskWithId),
	addTask: vi.fn(defaultImpls.addTask),
	mapDocToTask: vi.fn(defaultImpls.mapDocToTask),
	getTasksByDate: vi.fn(defaultImpls.getTasksByDate),
	getTasksForRange: vi.fn(defaultImpls.getTasksForRange),
	subscribeToTasksInRange: vi.fn(defaultImpls.subscribeToTasksInRange),
	deleteTask: vi.fn(defaultImpls.deleteTask),
	updateTasksOrder: vi.fn(defaultImpls.updateTasksOrder),
	rolloverTasks: vi.fn(defaultImpls.rolloverTasks),
	getTaskById: vi.fn(defaultImpls.getTaskById),
	updateTask: vi.fn(defaultImpls.updateTask),
	toggleTaskCompletion: vi.fn(defaultImpls.toggleTaskCompletion),
};

// Эмитит снапшот в последнюю подписку subscribeToTasksInRange.
export function emitSnapshot(tasks: Task[]) {
	if (!subscription) throw new Error("subscribeToTasksInRange ещё не вызывался");
	subscription.onTasks(tasks);
}

export function emitSubscriptionError(error: Error) {
	if (!subscription) throw new Error("subscribeToTasksInRange ещё не вызывался");
	subscription.onError(error);
}

// Следующий вызов указанной функции API реджектится.
export function failNext(name: keyof typeof mockTaskApi, error: Error = new Error("boom")) {
	(mockTaskApi[name] as unknown as Mock).mockRejectedValueOnce(error);
}

// Полный сброс мока между тестами. idCounter и subscription — обычные
// module-level переменные, а не состояние vi.fn, поэтому clearMocks/
// restoreMocks из vitest.config.ts их не трогают и обнулять их надо явно.
// Реализацию каждой функции тоже переустанавливаем явно поверх mockReset()
// (а не полагаемся на то, что restoreMocks восстановит исходный vi.fn(impl)):
// так поведение мока не зависит от версии vitest и деталей её restoreMocks.
export function resetTaskApiMock() {
	idCounter = 0;
	subscription = null;
	unsubscribeMock.mockReset();

	(Object.keys(mockTaskApi) as (keyof typeof mockTaskApi)[]).forEach((name) => {
		const fn = mockTaskApi[name] as unknown as Mock;
		fn.mockReset();
		fn.mockImplementation(defaultImpls[name] as (...args: unknown[]) => unknown);
	});
}
