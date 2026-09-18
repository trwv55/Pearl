import { makeAutoObservable, runInAction } from "mobx";
import { addDays, format } from "date-fns";
import type { Task } from "@/shared/types/task";
import { getTasksForRange } from "@/shared/api/taskApi";
import { MAX_MAIN_TASKS } from "@/shared/config/tasks";

interface DayStats {
	date: Date;
	isCompleted: boolean;
	completedMainTasksCount: number;
}

export interface WeekStats {
	days: DayStats[];
	completedDaysCount?: number;
}

export class StatsStore {
	weekStats: WeekStats | null = null;

	constructor() {
		makeAutoObservable(this);
	}

    get completedDaysCount() {
        return this.weekStats?.days.filter(d => d.isCompleted).length ?? 0
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
				const isCompleted = mainTasks.length === MAX_MAIN_TASKS && completedMainTasksCount === MAX_MAIN_TASKS;
				days.push({ date, isCompleted, completedMainTasksCount });
			}

			// const completedDaysCount = days.filter((d) => d.isCompleted).length;

			runInAction(() => {
				this.weekStats = { days };
			});
		} catch (error) {
			console.error("Ошибка при загрузке статистики недели:", error);
		}
	}
}

export const statsStore = new StatsStore();
