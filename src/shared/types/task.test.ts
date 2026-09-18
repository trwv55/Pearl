import { describe, expect, it } from "vitest";
import { compareTaskOrder, isTaskMain, isTaskRoutine, NO_ORDER } from "@/shared/types/task";
import { makeMain, makeRoutine, makeTask } from "@/shared/testing/factories";

describe("compareTaskOrder", () => {
	it("сортирует по order по возрастанию", () => {
		const a = makeTask({ order: 2 });
		const b = makeTask({ order: 1 });
		expect([a, b].sort(compareTaskOrder).map((t) => t.id)).toEqual([b.id, a.id]);
	});

	it("при равном order — старые (по createdAt) раньше", () => {
		const older = makeTask({ order: 0, createdAt: new Date(2026, 8, 1, 10) });
		const newer = makeTask({ order: 0, createdAt: new Date(2026, 8, 1, 11) });
		expect([newer, older].sort(compareTaskOrder).map((t) => t.id)).toEqual([older.id, newer.id]);
	});

	it("задачи без order (NO_ORDER) уходят в конец", () => {
		const legacy = makeTask({ order: NO_ORDER });
		const explicit = makeTask({ order: 5 });
		expect([legacy, explicit].sort(compareTaskOrder).map((t) => t.id)).toEqual([explicit.id, legacy.id]);
	});

	it("при равном order задача без createdAt — последняя", () => {
		const withDate = makeTask({ order: 0, createdAt: new Date(2026, 8, 1) });
		const noDate = makeTask({ order: 0, createdAt: null });
		expect([noDate, withDate].sort(compareTaskOrder).map((t) => t.id)).toEqual([withDate.id, noDate.id]);
	});
});

describe("type guards", () => {
	it("isTaskMain / isTaskRoutine различают по isMain", () => {
		expect(isTaskMain(makeMain())).toBe(true);
		expect(isTaskRoutine(makeMain())).toBe(false);
		expect(isTaskMain(makeRoutine())).toBe(false);
		expect(isTaskRoutine(makeRoutine())).toBe(true);
	});
});
