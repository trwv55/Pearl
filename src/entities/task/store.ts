import { makeAutoObservable, runInAction } from "mobx";
import { format, subDays, addDays } from "date-fns";
import { Task, getTasksForDateRange } from "./api";

export class TaskStore {
        tasksByDate = new Map<string, Task[]>();
        loadedRanges = new Set<string>();
        isLoading = false;

        currentUserId: string | null = null;

	constructor() {
		makeAutoObservable(this);
	}

	getTasksForDate(date: Date): Task[] | undefined {
		const key = format(date, "yyyy-MM-dd");
		return this.tasksByDate.get(key);
	}

	getTasksGroupedByMain(date: Date): { mainTasks: Task[]; otherTasks: Task[] } {
		const all = this.getTasksForDate(date) ?? [];
		return {
			mainTasks: all.filter(t => t.isMain),
			otherTasks: all.filter(t => !t.isMain),
		};
	}

	hasDateInCache(date: Date): boolean {
		const key = format(date, "yyyy-MM-dd");
		return this.tasksByDate.has(key);
	}

        async fetchTasksRange(userId: string, start: Date, end: Date) {
                const rangeKey = `${format(start, "yyyy-MM-dd")}_${format(end, "yyyy-MM-dd")}`;
                if (this.loadedRanges.has(rangeKey)) return;
                this.isLoading = true;
                try {
                        const tasks = await getTasksForDateRange(userId, start, end);
                        if (userId !== this.currentUserId) return;
                        runInAction(() => {
                                tasks.forEach(task => {
                                        const dateKey = format(task.date.toDate(), "yyyy-MM-dd");
                                        const existing = this.tasksByDate.get(dateKey) || [];
                                        this.tasksByDate.set(dateKey, [...existing, task]);
                                });
                                this.loadedRanges.add(rangeKey);
                        });
                } catch (error) {
                        console.error("Ошибка загрузки задач:", error);
                } finally {
                        runInAction(() => {
                                this.isLoading = false;
                        });
                }
        }

	addTaskToCache(task: Task) {
		const dateKey = format(task.date.toDate(), "yyyy-MM-dd");
		const existing = this.tasksByDate.get(dateKey) || [];

		// защита от дубликатов (на случай переотправки)
		if (existing.some(t => t.id === task.id)) return;

		this.tasksByDate.set(dateKey, [...existing, task]);
	}

        async initTaskCache(userId: string) {
                this.currentUserId = userId;

                const today = new Date();
                const start = subDays(today, 15);
                const end = addDays(today, 15);
                await this.fetchTasksRange(userId, start, end);
        }

        clearCache() {
                this.tasksByDate.clear();
                this.loadedRanges.clear();

                this.currentUserId = null;

        }
}

export const taskStore = new TaskStore();
