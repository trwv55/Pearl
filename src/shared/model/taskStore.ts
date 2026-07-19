"use client";

import { makeAutoObservable, runInAction } from "mobx";
import { getFirebaseDb } from "@/shared/lib/firebase";
import { format, addDays, startOfDay } from "date-fns";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
	deleteTask as deleteTaskApi,
	toggleTaskCompletion,
	addTaskWithId,
	generateTaskId,
	updateTask,
	type TaskPayload,
} from "@/shared/api/taskApi";
import { isTaskMain, isTaskRoutine, TaskRoutine, type Task, type TaskMain } from "@/shared/types/task";
import { showUndoToast } from "@/shared/lib/showUndoToast";
import { showErrorToast } from "@/shared/lib/showToast";
import { cancelTaskNotification, scheduleTaskNotification } from "@/shared/lib/notifications";

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

	// Заменяет задачу в кэше её даты НА МЕСТЕ (сохраняя позицию в списке).
	// Если задачи нет в списке (напр. дата не подгружена) — кладёт в начало.
	private replaceInCache(task: Task) {
		const key = this.getDateKey(task.date);
		const current = this.taskCache.get(key) ?? [];
		const idx = current.findIndex((t) => t.id === task.id);

		const next = idx === -1 ? [task, ...current] : current.map((t) => (t.id === task.id ? task : t));
		this.taskCache.set(key, next);

		if (this.getDateKey(this.selectedDate) === key) {
			this.tasks = next;
		}
	}

	// Кладёт задачу в кэш её даты (не обязательно выбранной) и обновляет
	// this.tasks, если эта дата сейчас открыта.
	private addToCache(task: Task) {
		const key = this.getDateKey(task.date);
		const current = this.taskCache.get(key) ?? [];
		const next = [task, ...current.filter((t) => t.id !== task.id)];
		this.taskCache.set(key, next);

		if (this.getDateKey(this.selectedDate) === key) {
			this.tasks = next;
		}
	}

	// Убирает задачу из кэша указанной даты и обновляет this.tasks,
	// если эта дата сейчас открыта.
	private removeFromCache(date: Date, taskId: string) {
		const key = this.getDateKey(date);
		const current = this.taskCache.get(key);
		if (current) {
			const next = current.filter((t) => t.id !== taskId);
			this.taskCache.set(key, next);

			if (this.getDateKey(this.selectedDate) === key) {
				this.tasks = next;
			}
		}
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

	// Оптимистичное создание: задача мгновенно появляется в UI, запись в
	// Firestore идёт в фоне. При ошибке — откат и тост. Возвращает id новой
	// задачи; сетевую часть НЕ ждём в вызывающем коде.
	createOptimistic(userId: string, payload: TaskPayload): string {
		const id = generateTaskId(userId);

		const task: Task = {
			id,
			title: payload.title,
			comment: payload.comment,
			date: payload.date,
			emoji: payload.emoji,
			isMain: payload.isMain,
			markerColor: payload.markerColor,
			time: payload.time,
			isCompleted: false,
			completedAt: null,
		};

		this.addToCache(task);
		scheduleTaskNotification(task);

		addTaskWithId(userId, id, payload).catch((e) => {
			console.error("Ошибка при создании задачи:", e);
			runInAction(() => this.removeFromCache(task.date, id));
			cancelTaskNotification(id);
			showErrorToast("Не удалось сохранить, задача убрана");
		});

		return id;
	}

	// Оптимистичное обновление: изменения сразу видны в UI, запись в Firestore
	// идёт в фоне. Учитывает смену даты (перенос между кэшами). При ошибке —
	// откат к прежнему состоянию и тост.
	updateOptimistic(userId: string, prevTask: Task, payload: Partial<TaskPayload>) {
		const updatedTask: Task = {
			...prevTask,
			...payload,
		};

		const dateChanged = this.getDateKey(prevTask.date) !== this.getDateKey(updatedTask.date);

		if (dateChanged) {
			this.removeFromCache(prevTask.date, prevTask.id);
			this.addToCache(updatedTask);
		} else {
			this.replaceInCache(updatedTask);
		}

		cancelTaskNotification(prevTask.id);
		scheduleTaskNotification(updatedTask);

		updateTask(userId, prevTask.id, payload).catch((e) => {
			console.error("Ошибка при обновлении задачи:", e);
			runInAction(() => {
				if (dateChanged) {
					this.removeFromCache(updatedTask.date, prevTask.id);
					this.addToCache(prevTask);
				} else {
					this.replaceInCache(prevTask);
				}
			});
			cancelTaskNotification(prevTask.id);
			scheduleTaskNotification(prevTask);
			showErrorToast("Не удалось сохранить, изменения отменены");
		});
	}

	async deleteWithUndo(userId: string, task: Task, delayMs = 4000, onDeleted?: () => void) {
		if (this.pending.has(task.id)) return;

		this.removeLocal(task.id);
		cancelTaskNotification(task.id);

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
				scheduleTaskNotification(task);
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
				scheduleTaskNotification(task);
			},
		});
	}

	async toggleCompletion(userId: string, taskId: string) {
		const existingTask = this.tasks.find((t) => t.id === taskId);

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

			if (existingTask) {
				if (updatedTask.isCompleted) {
					cancelTaskNotification(taskId);
				} else {
					scheduleTaskNotification(existingTask);
				}
			}
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
