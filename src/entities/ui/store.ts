"use client";

import { makeAutoObservable, runInAction } from "mobx";
import { getTaskById } from "@/entities/task/api";
import type { Task } from "@/entities/task/types";

class TaskViewStore {
	viewingTask: Task | null = null;
	viewingTaskId: string | null = null;
	isLoading: boolean = false;
	error: Error | null = null;

	constructor() {
		makeAutoObservable(this);
	}

	async openTaskView(userId: string, taskId: string) {
		this.viewingTaskId = taskId;
		this.isLoading = true;
		this.error = null;
		this.viewingTask = null;

		try {
			const task = await getTaskById(userId, taskId);
			runInAction(() => {
				this.viewingTask = task;
				this.isLoading = false;
			});
		} catch (err) {
			runInAction(() => {
				this.error = err instanceof Error ? err : new Error("Не удалось загрузить задачу");
				this.isLoading = false;
			});
			console.error("Ошибка при загрузке задачи:", err);
		}
	}

	closeTaskView() {
		this.viewingTask = null;
		this.viewingTaskId = null;
		this.isLoading = false;
		this.error = null;
	}

	get isOpen() {
		return this.viewingTaskId !== null;
	}
}

export const taskViewStore = new TaskViewStore();

