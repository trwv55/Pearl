import { makeAutoObservable, runInAction } from "mobx";
import { db } from "@/lib/firebase";
import { format, addDays, startOfDay } from "date-fns";
import { collection, getDocs, query, where } from "firebase/firestore";
import { deleteTask as deleteTaskApi, toggleTaskCompletion } from "@/entities/task/api";
import { isTaskMain, isTaskRoutine, TaskRoutine, type Task, type TaskMain } from "./types";
import { toast } from "sonner";
import { showUndoToast } from "@/shared/lib/showUndoToast";

class TaskStore {
	tasks: Task[] = [];
	selectedDate: Date = new Date();
	private taskCache: Map<string, Task[]> = new Map();
	// для Undo: запоминаем таймеры по id задач
	private pending: Map<string, ReturnType<typeof setTimeout>> = new Map();

	constructor() {
		makeAutoObservable(this);
	}

	private getDateKey(date: Date) {
		return format(date, "yyyy-MM-dd");
	}

	// Хелпер: обновить кэш для выбранной даты по текущему this.tasks
	private syncCacheForSelectedDate() {
		const key = this.getDateKey(this.selectedDate);
		this.taskCache.set(key, this.tasks);
	}

	// Убрать задачу локально (UI-оптимизм) + обновить кэш
	private removeLocal(taskId: string) {
		this.tasks = this.tasks.filter(t => t.id !== taskId);
		this.syncCacheForSelectedDate();
	}

	// Вернуть задачу локально (для Undo) + обновить кэш
	private addLocal(task: Task) {
		const next = this.tasks.filter(t => t.id !== task.id);
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
				completedAt: data.completedAt?.toDate() || null,
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

	// --- Удаление с Undo ---
	async deleteWithUndo(userId: string, task: Task, delayMs = 4000) {
		// если уже есть ожидающее удаление этой задачи — ничего не делаем
		if (this.pending.has(task.id)) return;

		// 1) мгновенно убираем из UI
		this.removeLocal(task.id);

		let cancelled = false;

		// 2) запускаем отложенное фактическое удаление из Firestore
		const timer = setTimeout(async () => {
			this.pending.delete(task.id);
			if (cancelled) return;
			try {
				await deleteTaskApi(userId, task.id);
				// если хочешь быть на 100% консистентным с сервером:
				// await this.reloadCurrentDay(userId);
			} catch (e) {
				runInAction(() => this.addLocal(task));
				console.error(e);
				toast.error("Не удалось удалить задачу");
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
			// Вызываем API для переключения статуса
			const updatedTask = await toggleTaskCompletion(userId, taskId);

			runInAction(() => {
				// Обновляем задачу в текущем списке
				const taskIndex = this.tasks.findIndex(t => t.id === taskId);
				if (taskIndex !== -1) {
					this.tasks[taskIndex] = {
						...this.tasks[taskIndex],
						isCompleted: updatedTask.isCompleted,
						completedAt: updatedTask.completedAt,
					};
				}

				// Обновляем кэш для текущей даты
				this.syncCacheForSelectedDate();
			});
		} catch (e) {
			console.error(e);
			toast.error("Не удалось обновить статус задачи");

			// Перезагружаем данные для актуального состояния
			await this.reloadCurrentDay(userId);
		}
	}

	// идикатор наличия задач
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
