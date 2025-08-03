import { makeAutoObservable, runInAction } from "mobx";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format, addDays, startOfDay } from "date-fns";
import type { Task } from "./types";

class TaskStore {
	tasks: Task[] = [];
	selectedDate: Date = new Date();
	private taskCache: Map<string, Task[]> = new Map();

	constructor() {
		makeAutoObservable(this);
	}

	private getDateKey(date: Date) {
		return format(date, "yyyy-MM-dd");
	}

	setSelectedDate(date: Date) {
		this.selectedDate = date;

		const key = this.getDateKey(date);
		if (this.taskCache.has(key)) {
			this.tasks = this.taskCache.get(key)!;
		} else {
			this.tasks = []; // ⬅️ сбрасываем при отсутствии данных
		}
	}

	async fetchTasks(userId: string, date: Date = this.selectedDate) {
		const start = startOfDay(date);
		const end = addDays(start, 1);
		const q = query(collection(db, "users", userId, "tasks"), where("date", ">=", start), where("date", "<", end));
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
			const key = this.getDateKey(date);
			this.taskCache.set(key, tasks);

			// Если дата совпадает с выбранной — обновляем отображение
			if (this.getDateKey(this.selectedDate) === key) {
				this.tasks = tasks;
			}
		});
	}

	async fetchTasksForRange(userId: string, startDate: Date, endDate: Date) {
		const q = query(
			collection(db, "users", userId, "tasks"),
			where("date", ">=", startOfDay(startDate)),
			where("date", "<", startOfDay(addDays(endDate, 1))),
		);

		const snapshot = await getDocs(q);

		const groupedTasks: Map<string, Task[]> = new Map();

		snapshot.docs.forEach(doc => {
			const data = doc.data();
			const task: Task = {
				id: doc.id,
				title: data.title,
				comment: data.comment,
				date: data.date.toDate ? data.date.toDate() : data.date,
				emoji: data.emoji,
				isMain: data.isMain,
				markerColor: data.markerColor,
				isCompleted: data.isCompleted,
			};

			const key = this.getDateKey(task.date);
			if (!groupedTasks.has(key)) {
				groupedTasks.set(key, []);
			}
			groupedTasks.get(key)!.push(task);
		});

		runInAction(() => {
			groupedTasks.forEach((tasks, key) => {
				this.taskCache.set(key, tasks);
				if (this.getDateKey(this.selectedDate) === key) {
					this.tasks = tasks;
				}
			});
		});
	}

	async reloadCurrentDay(userId: string) {
		await this.fetchTasks(userId, this.selectedDate);
	}

	get mainTasks() {
		return this.tasks.filter(t => t.isMain);
	}

	get routineTasks() {
		return this.tasks.filter(t => !t.isMain);
	}
}

export const taskStore = new TaskStore();
