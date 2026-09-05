import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskRolloverStore } from "@/shared/model/taskRolloverStore";

const ENABLED_KEY = "pearl.rollover.enabled";
const DATE_KEY = "pearl.rollover.enabledDate";

let store: TaskRolloverStore;

beforeEach(() => {
	store = new TaskRolloverStore();
});

describe("initialize", () => {
	it("по умолчанию выключен", () => {
		store.initialize();
		expect(store.isEnabled).toBe(false);
		expect(store.enabledDate).toBeNull();
		expect(store.isInitialized).toBe(true);
	});

	it("читает включённое состояние и дату из localStorage", () => {
		localStorage.setItem(ENABLED_KEY, "true");
		localStorage.setItem(DATE_KEY, "2026-09-01");
		store.initialize();
		expect(store.isEnabled).toBe(true);
		expect(store.enabledDate).toBe("2026-09-01");
	});

	it("идемпотентен — повторный вызов не перечитывает хранилище", () => {
		store.initialize();
		localStorage.setItem(ENABLED_KEY, "true");
		store.initialize();
		expect(store.isEnabled).toBe(false);
	});
});

describe("enable / disable", () => {
	it("enable пишет флаг и сегодняшнюю дату", () => {
		// Ruling A: фейковые таймеры включаем ДО setSystemTime — иначе поведение
		// setSystemTime без активных фейковых таймеров зависит от версии vitest.
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 8, 5, 12));
		store.enable();
		expect(store.isEnabled).toBe(true);
		expect(store.enabledDate).toBe("2026-09-05");
		expect(localStorage.getItem(ENABLED_KEY)).toBe("true");
		expect(localStorage.getItem(DATE_KEY)).toBe("2026-09-05");
	});

	it("disable сбрасывает флаг и удаляет дату", () => {
		store.enable();
		store.disable();
		expect(store.isEnabled).toBe(false);
		expect(store.enabledDate).toBeNull();
		expect(localStorage.getItem(ENABLED_KEY)).toBe("false");
		expect(localStorage.getItem(DATE_KEY)).toBeNull();
	});
});
