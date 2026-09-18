import type { Task, TaskMain, TaskRoutine } from "@/shared/types/task";

// Опорная дата тестов: 5 сентября 2026, локальное время (без TZ-сюрпризов ISO-строк).
export const TEST_DATE = new Date(2026, 8, 5);

let seq = 0;

// Валидная задача с дефолтами; переопределяется через overrides.
export function makeTask(overrides: Partial<Task> = {}): Task {
	seq += 1;
	return {
		id: `t${seq}`,
		title: `Задача ${seq}`,
		comment: "",
		date: TEST_DATE,
		emoji: "✅",
		isMain: false,
		markerColor: "#000000",
		isCompleted: false,
		completedAt: null,
		time: null,
		order: 0,
		createdAt: new Date(2026, 8, 1, 12, 0, seq),
		...overrides,
	};
}

export const makeMain = (overrides: Partial<Task> = {}): TaskMain =>
	makeTask({ ...overrides, isMain: true }) as TaskMain;

export const makeRoutine = (overrides: Partial<Task> = {}): TaskRoutine =>
	makeTask({ ...overrides, isMain: false }) as TaskRoutine;
