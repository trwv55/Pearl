import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDocs, onSnapshot, updateDoc, writeBatch } from "firebase/firestore";
import {
	getTasksForRange,
	mapDocToTask,
	rolloverTasks,
	subscribeToTasksInRange,
	updateTask,
	updateTasksOrder,
} from "@/shared/api/taskApi";
import { NO_ORDER } from "@/shared/types/task";

vi.mock("@/shared/lib/firebase", () => ({ getFirebaseDb: () => ({}) }));

vi.mock("firebase/firestore", () => ({
	collection: vi.fn((_db: unknown, ...path: string[]) => ({ path })),
	doc: vi.fn((_db: unknown, ...path: string[]) => ({ path })),
	query: vi.fn((ref: unknown, ...constraints: unknown[]) => ({ ref, constraints })),
	where: vi.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
	getDocs: vi.fn(),
	getDoc: vi.fn(),
	setDoc: vi.fn(),
	updateDoc: vi.fn(),
	deleteDoc: vi.fn(),
	addDoc: vi.fn(),
	runTransaction: vi.fn(),
	serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
	writeBatch: vi.fn(),
	onSnapshot: vi.fn(),
}));

// Имитация Firestore Timestamp: у него есть toDate().
const ts = (d: Date) => ({ toDate: () => d });

const baseDoc = {
	title: "Купить хлеб",
	comment: "",
	emoji: "🍞",
	isMain: true,
	markerColor: "#fff",
	isCompleted: false,
};

describe("mapDocToTask", () => {
	it("разворачивает Timestamp в Date и подставляет дефолты", () => {
		const date = new Date(2026, 8, 5);
		const created = new Date(2026, 8, 1);
		const task = mapDocToTask("id1", {
			...baseDoc,
			date: ts(date),
			completedAt: null,
			time: 600,
			order: 2,
			createdAt: ts(created),
		});
		expect(task).toEqual({
			id: "id1",
			...baseDoc,
			date,
			completedAt: null,
			time: 600,
			order: 2,
			createdAt: created,
		});
	});

	it("принимает date как обычный Date", () => {
		const date = new Date(2026, 8, 5);
		expect(mapDocToTask("id1", { ...baseDoc, date }).date).toBe(date);
	});

	it("отсутствующие completedAt/createdAt → null, time не число → null, нет order → NO_ORDER", () => {
		const task = mapDocToTask("id1", { ...baseDoc, date: new Date(2026, 8, 5), time: "10:00" });
		expect(task.completedAt).toBeNull();
		expect(task.createdAt).toBeNull();
		expect(task.time).toBeNull();
		expect(task.order).toBe(NO_ORDER);
	});

	it("completedAt с Timestamp разворачивается в Date", () => {
		const done = new Date(2026, 8, 5, 15);
		const task = mapDocToTask("id1", { ...baseDoc, date: new Date(2026, 8, 5), completedAt: ts(done) });
		expect(task.completedAt).toEqual(done);
	});
});

describe("updateTask", () => {
	it("пишет только заданные поля плюс updatedAt", async () => {
		await updateTask("u1", "t1", { title: "Новое", time: undefined });
		expect(updateDoc).toHaveBeenCalledTimes(1);
		const [, data] = vi.mocked(updateDoc).mock.calls[0];
		expect(data).toEqual({ title: "Новое", updatedAt: "SERVER_TIMESTAMP" });
	});
});

describe("батчи", () => {
	let batch: { update: ReturnType<typeof vi.fn>; commit: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		batch = { update: vi.fn(), commit: vi.fn(async () => {}) };
		vi.mocked(writeBatch).mockReturnValue(batch as never);
	});

	it("updateTasksOrder: пустой список — батч не создаётся", async () => {
		await updateTasksOrder("u1", []);
		expect(writeBatch).not.toHaveBeenCalled();
	});

	it("updateTasksOrder: по update на задачу и один commit", async () => {
		await updateTasksOrder("u1", [
			{ id: "a", order: 0 },
			{ id: "b", order: 1 },
		]);
		expect(batch.update).toHaveBeenCalledTimes(2);
		expect(batch.update.mock.calls[1][1]).toEqual({ order: 1, updatedAt: "SERVER_TIMESTAMP" });
		expect(batch.commit).toHaveBeenCalledTimes(1);
	});

	it("rolloverTasks: пустой список — батч не создаётся", async () => {
		await rolloverTasks("u1", []);
		expect(writeBatch).not.toHaveBeenCalled();
	});

	it("rolloverTasks: пишет date, isMain, order и updatedAt", async () => {
		const date = new Date(2026, 8, 5);
		await rolloverTasks("u1", [{ id: "a", date, isMain: false, order: 3 }]);
		expect(batch.update.mock.calls[0][1]).toEqual({ date, isMain: false, order: 3, updatedAt: "SERVER_TIMESTAMP" });
		expect(batch.commit).toHaveBeenCalledTimes(1);
	});
});

describe("getTasksForRange", () => {
	beforeEach(() => {
		vi.mocked(getDocs).mockReset();
	});

	it("маппит документы снапшота в Task", async () => {
		vi.mocked(getDocs).mockResolvedValue({
			docs: [{ id: "a", data: () => ({ ...baseDoc, date: new Date(2026, 8, 5) }) }],
		} as never);
		const tasks = await getTasksForRange("u1", new Date(2026, 8, 1), new Date(2026, 8, 7));
		expect(tasks).toHaveLength(1);
		expect(tasks[0].id).toBe("a");
	});
});

describe("subscribeToTasksInRange", () => {
	it("прокидывает смаппленные задачи в onTasks, ошибку — в onError, возвращает отписку", () => {
		const unsubscribe = vi.fn();
		vi.mocked(onSnapshot).mockReturnValue(unsubscribe as never);

		const onTasks = vi.fn();
		const onError = vi.fn();
		const result = subscribeToTasksInRange("u1", new Date(2026, 8, 1), new Date(2026, 8, 7), onTasks, onError);

		expect(result).toBe(unsubscribe);
		const [, onNext, onErr] = vi.mocked(onSnapshot).mock.calls[0] as unknown as [
			unknown,
			(snap: { docs: { id: string; data: () => unknown }[] }) => void,
			(e: Error) => void,
		];

		onNext({ docs: [{ id: "a", data: () => ({ ...baseDoc, date: new Date(2026, 8, 5) }) }] });
		expect(onTasks).toHaveBeenCalledTimes(1);
		expect(onTasks.mock.calls[0][0][0].id).toBe("a");

		const err = new Error("permission-denied");
		onErr(err);
		expect(onError).toHaveBeenCalledWith(err);
	});
});
