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
	updateTasksOrder,
	rolloverTasks,
	mapDocToTask,
	type TaskPayload,
} from "@/shared/api/taskApi";
import { MAX_MAIN_TASKS, ROLLOVER_CUTOFF_HOUR } from "@/shared/config/tasks";
import {
	isTaskMain,
	isTaskRoutine,
	compareTaskOrder,
	NO_ORDER,
	TaskRoutine,
	type Task,
	type TaskMain,
} from "@/shared/types/task";
import { showUndoToast } from "@/shared/lib/showUndoToast";
import { showErrorToast } from "@/shared/lib/showToast";
import { cancelTaskNotification, scheduleTaskNotification } from "@/shared/lib/notifications";

class TaskStore {
	tasks: Task[] = [];
	selectedDate: Date = new Date();
	private taskCache: Map<string, Task[]> = new Map();
	// Отложенные удаления: таймер + commit (немедленно довести удаление до конца).
	private pending: Map<string, { timer: ReturnType<typeof setTimeout>; commit: () => void }> = new Map();
	// Даты, по которым сейчас идёт догрузка — чтобы не слать дубли запросов.
	private inFlightDates: Set<string> = new Set();

	constructor() {
		makeAutoObservable(this);

		// Приложение уходит в фон — немедленно завершаем отложенные удаления,
		// не дожидаясь таймера: iOS замораживает таймеры в WebView, и удаление
		// иначе не уедет на сервер, а задача «воскреснет» при следующем запуске.
		if (typeof document !== "undefined") {
			document.addEventListener("visibilitychange", () => {
				if (document.hidden) this.flushPendingDeletes();
			});
		}
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
			const tasks: Task[] = snapshot.docs.map((doc) => mapDocToTask(doc.id, doc.data()));

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
				const task = mapDocToTask(doc.id, doc.data());

				const key = this.getDateKey(task.date);
				if (!groupedTasks.has(key)) {
					groupedTasks.set(key, []);
				}
				groupedTasks.get(key)!.push(task);
			});

			runInAction(() => {
				// Помечаем загруженным ВЕСЬ диапазон, включая дни без задач —
				// иначе пустой день выглядит как незагруженный и мы шлём лишний запрос.
				for (let d = startOfDay(startDate); d < startOfDay(addDays(endDate, 1)); d = addDays(d, 1)) {
					const key = this.getDateKey(d);
					this.taskCache.set(key, groupedTasks.get(key) ?? []);
				}

				const selectedKey = this.getDateKey(this.selectedDate);
				if (this.taskCache.has(selectedKey)) {
					this.tasks = this.taskCache.get(selectedKey)!;
				}
			});
		} catch (error) {
			console.error("Ошибка при загрузке задач за диапазон:", error);
		}
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
		const order = this.nextOrder(payload.date, payload.isMain);

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
			order,
			createdAt: new Date(),
		};

		this.addToCache(task);
		scheduleTaskNotification(task);

		addTaskWithId(userId, id, payload, order).catch((e) => {
			console.error("Ошибка при создании задачи:", e);
			runInAction(() => this.removeFromCache(task.date, id));
			cancelTaskNotification(id);
			showErrorToast("Не удалось сохранить, задача убрана");
		});

		return id;
	}

	// Следующий order для нового элемента: max среди задач того же типа в дне + 1.
	// Игнорирует задачи без явного order (NO_ORDER), чтобы новая не улетала в конец.
	private nextOrder(date: Date, isMain: boolean): number {
		const tasks = this.getTasksForDate(date).filter((t) => t.isMain === isMain && t.order !== NO_ORDER);
		if (tasks.length === 0) return 0;
		return Math.max(...tasks.map((t) => t.order)) + 1;
	}

	// Оптимистичная перестановка: задаём новые order по порядку в orderedTasks,
	// сразу применяем в кэше, батч-запись в фон. При ошибке — откат и тост.
	reorderOptimistic(userId: string, orderedTasks: Task[]) {
		if (orderedTasks.length === 0) return;

		const prevById = new Map(orderedTasks.map((t) => [t.id, t.order]));

		const updates = orderedTasks.map((t, index) => ({ id: t.id, order: index }));

		runInAction(() => {
			orderedTasks.forEach((t, index) => {
				this.replaceInCache({ ...t, order: index });
			});
		});

		updateTasksOrder(userId, updates).catch((e) => {
			console.error("Ошибка при сохранении порядка задач:", e);
			runInAction(() => {
				orderedTasks.forEach((t) => {
					const prevOrder = prevById.get(t.id);
					if (prevOrder !== undefined) this.replaceInCache({ ...t, order: prevOrder });
				});
			});
			showErrorToast("Не удалось сохранить порядок");
		});
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

		// settled гарантирует, что удаление ИЛИ отмена сработают ровно один раз,
		// кто бы ни пришёл первым: таймер, флаш при сворачивании или «Отменить».
		let settled = false;

		const commit = async () => {
			if (settled) return;
			settled = true;
			const entry = this.pending.get(task.id);
			if (entry) clearTimeout(entry.timer);
			this.pending.delete(task.id);
			try {
				await deleteTaskApi(userId, task.id);
				onDeleted?.();
			} catch (e) {
				runInAction(() => this.addLocal(task));
				scheduleTaskNotification(task);
				console.error("Ошибка при удалении задачи:", e);
				showErrorToast("Ошибка. Попробуй еще раз");
			}
		};

		const cancel = () => {
			if (settled) return;
			settled = true;
			const entry = this.pending.get(task.id);
			if (entry) clearTimeout(entry.timer);
			this.pending.delete(task.id);
			runInAction(() => this.addLocal(task));
			scheduleTaskNotification(task);
		};

		const timer = setTimeout(commit, delayMs);
		this.pending.set(task.id, { timer, commit });

		showUndoToast({
			title: "Задача удалена",
			duration: delayMs,
			onUndo: cancel,
		});
	}

	// Немедленно завершает все отложенные удаления (вызывается при сворачивании
	// приложения). Каждый commit защищён флагом settled от повторного запуска.
	flushPendingDeletes() {
		this.pending.forEach((entry) => entry.commit());
	}

	// Оптимистичное переключение статуса: применяем сразу и с привязкой к дню
	// самой задачи (task.date), а НЕ к текущему selectedDate. Иначе смена дня
	// во время медленного запроса теряет обновление, и галочка «слетает».
	// Возвращает промис завершения фоновой записи — чтобы вызвавший код мог
	// дождаться её перед обновлением недельной статистики.
	toggleCompletion(userId: string, taskId: string): Promise<void> {
		const task = this.tasks.find((t) => t.id === taskId);
		if (!task) return Promise.resolve();

		const newIsCompleted = !task.isCompleted;
		const optimistic: Task = {
			...task,
			isCompleted: newIsCompleted,
			completedAt: newIsCompleted ? new Date() : null,
		};

		this.replaceInCache(optimistic);

		if (newIsCompleted) {
			cancelTaskNotification(taskId);
		} else {
			scheduleTaskNotification(optimistic);
		}

		return toggleTaskCompletion(userId, taskId)
			.then(() => undefined)
			.catch((e) => {
				console.error("Ошибка при обновлении статуса задачи:", e);
				runInAction(() => this.replaceInCache(task));
				if (newIsCompleted) {
					scheduleTaskNotification(task);
				} else {
					cancelTaskNotification(taskId);
				}
				showErrorToast("Не удалось обновить статус задачи");
			});
	}

	// «У дня есть задачи» — для индикатора в переключателе дней.
	// НЕ путать с isDateLoaded: честно пустой день вернёт false.
	hasTasksForDate(date: Date): boolean {
		const key = this.getDateKey(date);
		const tasks = this.taskCache.get(key);
		return !!tasks && tasks.length > 0;
	}

	// «День уже загружен с сервера» — в т.ч. если задач в нём нет.
	isDateLoaded(date: Date): boolean {
		return this.taskCache.has(this.getDateKey(date));
	}

	// Догружает день, если он ещё не загружен. Защищено от параллельных
	// запросов по одной дате (быстрое листание календаря).
	async ensureTasksForDate(userId: string, date: Date) {
		const key = this.getDateKey(date);
		if (this.taskCache.has(key) || this.inFlightDates.has(key)) return;

		this.inFlightDates.add(key);
		try {
			await this.fetchTasks(userId, date);
		} finally {
			this.inFlightDates.delete(key);
		}
	}

	getTasksForDate(date: Date): Task[] {
		const key = this.getDateKey(date);
		return this.taskCache.get(key) ?? [];
	}

	// Автопродление: переносит невыполненные ГЛАВНЫЕ задачи с прошедших дней
	// (начиная с sinceDate — даты включения тоггла) на активный день. Если лимит
	// главных на активном дне исчерпан, лишние становятся рутинными.
	// «Активный день» начинается в ROLLOVER_CUTOFF_HOUR (04:00): с 00:00 до 03:59
	// прошлый календарный день ещё активен и задачи не переносятся.
	async rolloverOverdueMainTasks(userId: string, sinceDate: Date) {
		const now = new Date();
		const activeDay = startOfDay(now.getHours() < ROLLOVER_CUTOFF_HOUR ? addDays(now, -1) : now);
		const since = startOfDay(sinceDate);
		if (since >= activeDay) return;

		// Тянем задачи диапазона [since, activeDay) по дате; фильтр по isMain/isCompleted
		// на клиенте, чтобы не заводить составной индекс Firestore.
		const db = getFirebaseDb();
		const q = query(
			collection(db, "users", userId, "tasks"),
			where("date", ">=", since),
			where("date", "<", activeDay),
		);
		const snapshot = await getDocs(q);
		const overdue = snapshot.docs
			.map((d) => mapDocToTask(d.id, d.data()))
			.filter((t) => t.isMain && !t.isCompleted)
			.sort((a, b) => a.date.getTime() - b.date.getTime() || compareTaskOrder(a, b));

		if (overdue.length === 0) return;

		// Сколько главных уже на активном дне — чтобы соблюсти лимит.
		await this.ensureTasksForDate(userId, activeDay);
		let mainCount = this.getTasksForDate(activeDay).filter(isTaskMain).length;

		const updates: { id: string; date: Date; isMain: boolean; order: number }[] = [];
		for (const task of overdue) {
			const newIsMain = mainCount < MAX_MAIN_TASKS;
			if (newIsMain) mainCount++;
			const order = this.nextOrder(activeDay, newIsMain);
			const moved: Task = { ...task, date: activeDay, isMain: newIsMain, order };

			runInAction(() => {
				this.removeFromCache(task.date, task.id);
				this.addToCache(moved);
			});
			updates.push({ id: task.id, date: activeDay, isMain: newIsMain, order });
		}

		try {
			await rolloverTasks(userId, updates);
		} catch (e) {
			console.error("Ошибка автопродления задач:", e);
		}
	}

	get mainTasks(): TaskMain[] {
		return this.tasks.filter(isTaskMain).sort(compareTaskOrder);
	}

	get routineTasks(): TaskRoutine[] {
		return this.tasks.filter(isTaskRoutine).sort(compareTaskOrder);
	}
}

export const taskStore = new TaskStore();
