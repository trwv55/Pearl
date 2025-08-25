import { makeAutoObservable, autorun, runInAction } from "mobx";
import { addDays } from "date-fns";
import { taskStore } from "@/entities/task/store";

import type { Task } from "@/entities/task/types";

interface DayStats {
    date: Date;
    isCompleted: boolean;
}

export interface WeekStats {
    days: DayStats[];
    completedDaysCount: number;
}

class StatsStore {
    weekStats: WeekStats | null = null;
    private weekStart: Date | null = null;
    private userId: string | null = null;

    constructor() {
        makeAutoObservable(this);

        autorun(() => {
            if (!this.userId || !this.weekStart) return;
            const stats = this.computeWeekStats();
            runInAction(() => {
                this.weekStats = stats;
            });
        });
    }

    private computeWeekStats(): WeekStats {
        const days: DayStats[] = [];
        const start = this.weekStart!;
        for (let i = 0; i < 7; i++) {
            const date = addDays(start, i);
            const tasks: Task[] = taskStore.getTasksForDate(date);
            const mainTasks = tasks.filter(t => t.isMain);
            const isCompleted = mainTasks.length === 3 && mainTasks.every(t => t.isCompleted);
            days.push({ date, isCompleted });
        }
        const completedDaysCount = days.filter(d => d.isCompleted).length;
        return { days, completedDaysCount };
    }

    async fetchWeekStats(userId: string, weekStart: Date) {
        this.userId = userId;
        this.weekStart = weekStart;
        await taskStore.fetchTasksForRange(userId, weekStart, addDays(weekStart, 6));
        runInAction(() => {
            this.weekStats = this.computeWeekStats();
        });
    }
}

export const statsStore = new StatsStore();
