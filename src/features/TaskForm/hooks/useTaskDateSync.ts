import { useState, useEffect, useRef } from "react";
import { isSameDay } from "date-fns";
import { userStore } from "@/entities/user/store";
import { taskStore } from "@/entities/task/store";
import { isTaskMain } from "@/entities/task/types";
import { MAX_MAIN_TASKS } from "@/features/dashboard/constants";

interface UseTaskDateSyncOptions {
	originalDate?: Date; // Исходная дата (для редактирования)
	onAutoSwitch?: (shouldSwitch: boolean) => void; // Callback для автоматического переключения на "НЕ главная"
}

interface UseTaskDateSyncResult {
	isLoadingTasks: boolean;
}

/**
 * Хук для синхронизации задач при изменении даты
 * Загружает задачи для выбранной даты и проверяет, нужно ли автоматически переключить задачу на "НЕ главная"
 */
export const useTaskDateSync = (date: Date, options?: UseTaskDateSyncOptions): UseTaskDateSyncResult => {
	const { originalDate, onAutoSwitch } = options || {};
	const [isLoadingTasks, setIsLoadingTasks] = useState(false);
	const onAutoSwitchRef = useRef(onAutoSwitch);

	// Сохраняем актуальную версию callback в ref
	useEffect(() => {
		onAutoSwitchRef.current = onAutoSwitch;
	}, [onAutoSwitch]);

	useEffect(() => {
		if (!userStore.user) return;

		const loadTasksForDate = async () => {
			// Проверяем, есть ли данные в кеше
			const hasCachedData = taskStore.hasTasksForDate(date);

			// Если данных нет в кеше - загружаем
			if (!hasCachedData) {
				setIsLoadingTasks(true);
				try {
					await taskStore.fetchTasks(userStore.user!.uid, date);
				} catch (error) {
					console.error("Ошибка при загрузке задач для даты:", error);
				} finally {
					setIsLoadingTasks(false);
				}
			}

			// После загрузки (или если данные уже были в кеше) проверяем, нужно ли автоматически переключить на "НЕ главная"
			const dateChanged = originalDate ? !isSameDay(date, originalDate) : true;

			if (dateChanged) {
				const tasksForNewDate = taskStore.getTasksForDate(date);
				const mainTasksForNewDate = tasksForNewDate.filter(isTaskMain);

				// Если на новой дате уже максимум главных задач - вызываем callback для переключения
				if (mainTasksForNewDate.length >= MAX_MAIN_TASKS && onAutoSwitchRef.current) {
					onAutoSwitchRef.current(true);
				}
			}
		};

		loadTasksForDate();
	}, [date, originalDate]);

	return { isLoadingTasks };
};

