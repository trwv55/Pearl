import { makeAutoObservable, runInAction } from "mobx";
import { addDays, format } from "date-fns";
import type { Task } from "@/entities/task/types";
import { getTasksForRange } from "@/entities/task/api";

interface DayStats {
	date: Date;
	isCompleted: boolean;
	completedMainTasksCount: number;
}

export interface WeekStats {
	days: DayStats[];
	completedDaysCount: number;
}

class StatsStore {
	weekStats: WeekStats | null = null;
	constructor() {
		makeAutoObservable(this);
	}

	async fetchWeekStats(userId: string, weekStart: Date) {
		try {
			const tasks = await getTasksForRange(userId, weekStart, addDays(weekStart, 6));

			const tasksByDate = new Map<string, Task[]>();
			tasks.forEach((task) => {
				const key = format(task.date, "yyyy-MM-dd");
				if (!tasksByDate.has(key)) {
					tasksByDate.set(key, []);
				}
				tasksByDate.get(key)!.push(task);
			});

			const days: DayStats[] = [];
			for (let i = 0; i < 7; i++) {
				const date = addDays(weekStart, i);
				const key = format(date, "yyyy-MM-dd");
				const dayTasks = tasksByDate.get(key) ?? [];
				const mainTasks = dayTasks.filter((t) => t.isMain);
				const completedMainTasksCount = mainTasks.filter((t) => t.isCompleted).length;
				const isCompleted = mainTasks.length === 3 && completedMainTasksCount === 3;
				days.push({ date, isCompleted, completedMainTasksCount });
			}

			const completedDaysCount = days.filter((d) => d.isCompleted).length;

			runInAction(() => {
				this.weekStats = { days, completedDaysCount };
			});
		} catch (error) {
			console.error("Ошибка при загрузке статистики недели:", error);
		}
	}
}

export const statsStore = new StatsStore();
