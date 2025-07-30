import { makeAutoObservable, runInAction } from "mobx";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { addDays, startOfDay } from "date-fns";
import type { Task } from "./types";

class TaskStore {
    tasks: Task[] = [];
    selectedDate: Date = new Date();

    constructor() {
        makeAutoObservable(this);
    }

    setSelectedDate(date: Date) {
        this.selectedDate = date;
    }

    async fetchTasks(userId: string, date: Date = this.selectedDate) {
        const start = startOfDay(date);
        const end = addDays(start, 1);
        const q = query(
            collection(db, "users", userId, "tasks"),
            where("date", ">=", start),
            where("date", "<", end)
        );
        const snapshot = await getDocs(q);
        const tasks: Task[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                comment: data.comment,
                date: data.date.toDate ? data.date.toDate() : data.date,
                emoji: data.emoji,
                isMain: data.isMain,
                markerColor: data.markerColor,
                isCompleted: data.isCompleted,
            } as Task;
        });
        runInAction(() => {
            this.tasks = tasks;
        });
    }

    get mainTasks() {
        return this.tasks.filter(t => t.isMain);
    }

    get routineTasks() {
        return this.tasks.filter(t => !t.isMain);
    }
}

export const taskStore = new TaskStore();
