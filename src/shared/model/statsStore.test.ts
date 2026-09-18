import { beforeEach, describe, expect, it, vi } from "vitest";
import { addDays } from "date-fns";
import { StatsStore } from "@/shared/model/statsStore";
import { makeMain, makeRoutine } from "@/shared/testing/factories";
import { failNext, mockTaskApi } from "@/shared/testing/mocks/taskApi";

vi.mock("@/shared/api/taskApi", async () => (await import("@/shared/testing/mocks/taskApi")).mockTaskApi);

const USER = "u1";
const WEEK_START = new Date(2026, 8, 7); // понедельник
const day = (offset: number) => addDays(WEEK_START, offset);

let store: StatsStore;

beforeEach(() => {
	store = new StatsStore();
});

describe("fetchWeekStats", () => {
	it("запрашивает 7 дней от weekStart и строит по дню на каждый", async () => {
		await store.fetchWeekStats(USER, WEEK_START);

		expect(mockTaskApi.getTasksForRange).toHaveBeenCalledWith(USER, WEEK_START, day(6));
		expect(store.weekStats?.days).toHaveLength(7);
		expect(store.weekStats?.days[0].date).toEqual(WEEK_START);
		expect(store.weekStats?.days[6].date).toEqual(day(6));
	});

	it("день выполнен только при 3 главных, все выполнены", async () => {
		mockTaskApi.getTasksForRange.mockResolvedValueOnce([
			// день 0: 3/3
			makeMain({ date: day(0), isCompleted: true }),
			makeMain({ date: day(0), isCompleted: true }),
			makeMain({ date: day(0), isCompleted: true }),
			// день 1: 2/3
			makeMain({ date: day(1), isCompleted: true }),
			makeMain({ date: day(1), isCompleted: true }),
			makeMain({ date: day(1), isCompleted: false }),
			// день 2: 2 главные, обе выполнены — но их не 3
			makeMain({ date: day(2), isCompleted: true }),
			makeMain({ date: day(2), isCompleted: true }),
			// день 3: только рутинные
			makeRoutine({ date: day(3), isCompleted: true }),
		]);

		await store.fetchWeekStats(USER, WEEK_START);
		const days = store.weekStats!.days;

		expect(days[0]).toMatchObject({ isCompleted: true, completedMainTasksCount: 3 });
		expect(days[1]).toMatchObject({ isCompleted: false, completedMainTasksCount: 2 });
		expect(days[2]).toMatchObject({ isCompleted: false, completedMainTasksCount: 2 });
		expect(days[3]).toMatchObject({ isCompleted: false, completedMainTasksCount: 0 });
		expect(store.completedDaysCount).toBe(1);
	});

	it("completedDaysCount = 0 без данных", () => {
		expect(store.completedDaysCount).toBe(0);
	});

	it("ошибка API → weekStats не меняется", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		failNext("getTasksForRange");
		await store.fetchWeekStats(USER, WEEK_START);
		expect(store.weekStats).toBeNull();
	});
});
