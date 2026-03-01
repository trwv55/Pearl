"use client";

import { makeAutoObservable, runInAction } from "mobx";
import { getFirebaseDb } from "@/shared/lib/firebase";
import { format, addDays, startOfDay } from "date-fns";
import { collection, getDocs, query, where } from "firebase/firestore";
import { deleteTask as deleteTaskApi, toggleTaskCompletion } from "@/shared/api/taskApi";
import { isTaskMain, isTaskRoutine, TaskRoutine, type Task, type TaskMain } from "@/shared/types/task";
import { showUndoToast } from "@/shared/lib/showUndoToast";
import { showErrorToast } from "@/shared/lib/showToast";

class TaskStore {
	tasks: Task[] = [];
	selectedDate: Date = new Date();
	private taskCache: Map<string, Task[]> = new Map();
	private pending: Map<string, ReturnType<typeof setTimeout>> = new Map();

	constructor() {
		makeAutoObservable(this);
	}

	private getDateKey(date: Date) {
		return format(date, "yyyy-MM-dd");
	}

	private syncCacheForSelectedDate() {
		const key = this.getDateKey(this.selectedDate);
		this.taskCache.set(key, this.tasks);
	}

	private removeLocal(taskId: string) {
		this.tasks = this.tasks.filter((t) => t.id !== taskId);
		this.syncCacheForSelectedDate();
	}

	private addLocal(task: Task) {
		const next = this.tasks.filter((t) => t.id !== task.id);
		this.tasks = [task, ...next];
		this.syncCacheForSelectedDate();
	}

	setSelectedDate(date: Date) {
		this.selectedDate = date;

		const key = this.getDateKey(date);
		if (this.taskCache.has(key)) {
			this.tasks = this.taskCache.get(key)!;
		} else {
			this.tasks = [];
		}
	}

	async fetchTasks(userId: string, date: Date = this.selectedDate) {
		try {
			const db = getFirebaseDb();
			const start = startOfDay(date);
			const end = addDays(start, 1);
			const q = query(collection(db, "users", userId, "tasks"), where("date", ">=", start), where("date", "<", end));
			const snapshot = await getDocs(q);
			const tasks: Task[] = snapshot.docs.map((doc) => {
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
					completedAt: data.completedAt?.toDate() || null,
					time: typeof data.time === "number" ? data.time : null,
				};
			});

			runInAction(() => {
				const key = this.getDateKey(date);
				this.taskCache.set(key, tasks);

				if (this.getDateKey(this.selectedDate) === key) {
					this.tasks = tasks;
				}
			});
		} catch (error) {
			console.error("Ошибка при загрузке задач:", error);
		}
	}

	async fetchTasksForRange(userId: string, startDate: Date, endDate: Date) {
		try {
			const db = getFirebaseDb();
			const q = query(
				collection(db, "users", userId, "tasks"),
				where("date", ">=", startOfDay(startDate)),
				where("date", "<", startOfDay(addDays(endDate, 1))),
			);

			const snapshot = await getDocs(q);
			const groupedTasks: Map<string, Task[]> = new Map();

			snapshot.docs.forEach((doc) => {
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
					completedAt: data.completedAt?.toDate() || null,
					time: typeof data.time === "number" ? data.time : null,
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
		} catch (error) {
			console.error("Ошибка при загрузке задач за диапазон:", error);
		}
	}

	async reloadCurrentDay(userId: string) {
		await this.fetchTasks(userId, this.selectedDate);
	}

	clearCache() {
		this.taskCache.clear();
		this.tasks = [];
	}

	async deleteWithUndo(userId: string, task: Task, delayMs = 4000, onDeleted?: () => void) {
		if (this.pending.has(task.id)) return;

		this.removeLocal(task.id);

		let cancelled = false;

		const timer = setTimeout(async () => {
			this.pending.delete(task.id);
			if (cancelled) return;
			try {
				await deleteTaskApi(userId, task.id);
				if (onDeleted) {
					onDeleted();
				}
			} catch (e) {
				runInAction(() => this.addLocal(task));
				console.error("Ошибка при удалении задачи:", e);
				showErrorToast("Ошибка. Попробуй еще раз");
			}
		}, delayMs);

		this.pending.set(task.id, timer);

		showUndoToast({
			title: "Задача удалена",
			duration: delayMs,
			onUndo: () => {
				cancelled = true;
				const timer = this.pending.get(task.id);
				if (timer) clearTimeout(timer);
				this.pending.delete(task.id);
				runInAction(() => this.addLocal(task));
			},
		});
	}

	async toggleCompletion(userId: string, taskId: string) {
		try {
			const updatedTask = await toggleTaskCompletion(userId, taskId);

			runInAction(() => {
				const taskIndex = this.tasks.findIndex((t) => t.id === taskId);
				if (taskIndex !== -1) {
					this.tasks[taskIndex] = {
						...this.tasks[taskIndex],
						isCompleted: updatedTask.isCompleted,
						completedAt: updatedTask.completedAt,
					};
				}

				this.syncCacheForSelectedDate();
			});
		} catch (e) {
			console.error("Ошибка при обновлении статуса задачи:", e);
			showErrorToast("Не удалось обновить статус задачи");

			await this.reloadCurrentDay(userId);
		}
	}

	hasTasksForDate(date: Date): boolean {
		const key = this.getDateKey(date);
		const tasks = this.taskCache.get(key);
		return !!tasks && tasks.length > 0;
	}

	getTasksForDate(date: Date): Task[] {
		const key = this.getDateKey(date);
		return this.taskCache.get(key) ?? [];
	}

	get mainTasks(): TaskMain[] {
		return this.tasks.filter(isTaskMain);
	}

	get routineTasks(): TaskRoutine[] {
		return this.tasks.filter(isTaskRoutine);
	}
}

export const taskStore = new TaskStore();
