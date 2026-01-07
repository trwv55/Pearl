import { useState, useEffect, useRef } from "react";
import { isSameDay } from "date-fns";
import { userStore } from "@/entities/user/store";
import { taskStore } from "@/entities/task/store";
import { isTaskMain } from "@/entities/task/types";
import { MAX_MAIN_TASKS } from "@/features/dashboard/constants";

interface UseDuplicateTaskDateSyncOptions {
	originalDate: Date; // Исходная дата задачи
	originalIsMain: boolean; // Исходное значение isMain из задачи
	onIsMainChange: (isMain: boolean) => void; // Callback для изменения isMain
}

interface UseDuplicateTaskDateSyncResult {
	isLoadingTasks: boolean;
}

/**
 * Хук для синхронизации задач при изменении даты при дублировании
 * Загружает задачи для выбранной даты и автоматически управляет isMain:
 * - Если на новой дате 3/3 главных задач - переключает isMain на false
 * - Если на новой дате <3/3 и задача изначально была главной - восстанавливает isMain в true
 */
export const useDuplicateTaskDateSync = (
	date: Date,
	options: UseDuplicateTaskDateSyncOptions,
): UseDuplicateTaskDateSyncResult => {
	const { originalDate, originalIsMain, onIsMainChange } = options;
	const [isLoadingTasks, setIsLoadingTasks] = useState(false);
	const onIsMainChangeRef = useRef(onIsMainChange);
	const originalIsMainRef = useRef(originalIsMain);

	// Сохраняем актуальные версии callbacks в ref
	useEffect(() => {
		onIsMainChangeRef.current = onIsMainChange;
		originalIsMainRef.current = originalIsMain;
	}, [onIsMainChange, originalIsMain]);

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

			// После загрузки (или если данные уже были в кеше) проверяем лимит главных задач
			// Всегда проверяем текущую дату, не только при изменении
			const tasksForCurrentDate = taskStore.getTasksForDate(date);
			const mainTasksForCurrentDate = tasksForCurrentDate.filter(isTaskMain);
			const mainTasksCount = mainTasksForCurrentDate.length;

			// Всегда когда 3/3 - ставим задачу как не главную
			if (mainTasksCount >= MAX_MAIN_TASKS) {
				onIsMainChangeRef.current(false);
			} else if (originalIsMainRef.current) {
				// Если на текущей дате есть место и задача изначально была главной - восстанавливаем в true
				onIsMainChangeRef.current(true);
			}
		};

		loadTasksForDate();
	}, [date, originalDate]);

	return { isLoadingTasks };
};

