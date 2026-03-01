import { useState, useEffect, useRef } from "react";
import { isSameDay } from "date-fns";
import { userStore } from "@/shared/model/userStore";
import { taskStore } from "@/shared/model/taskStore";
import { isTaskMain } from "@/shared/types/task";
import { MAX_MAIN_TASKS } from "@/shared/config/tasks";

interface UseDuplicateTaskDateSyncOptions {
	originalDate: Date;
	originalIsMain: boolean;
	onIsMainChange: (isMain: boolean) => void;
}

interface UseDuplicateTaskDateSyncResult {
	isLoadingTasks: boolean;
}

export const useDuplicateTaskDateSync = (
	date: Date,
	options: UseDuplicateTaskDateSyncOptions,
): UseDuplicateTaskDateSyncResult => {
	const { originalDate, originalIsMain, onIsMainChange } = options;
	const [isLoadingTasks, setIsLoadingTasks] = useState(false);
	const onIsMainChangeRef = useRef(onIsMainChange);
	const originalIsMainRef = useRef(originalIsMain);

	useEffect(() => {
		onIsMainChangeRef.current = onIsMainChange;
		originalIsMainRef.current = originalIsMain;
	}, [onIsMainChange, originalIsMain]);

	useEffect(() => {
		if (!userStore.user) return;

		const loadTasksForDate = async () => {
			const hasCachedData = taskStore.hasTasksForDate(date);

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

			const tasksForCurrentDate = taskStore.getTasksForDate(date);
			const mainTasksForCurrentDate = tasksForCurrentDate.filter(isTaskMain);
			const mainTasksCount = mainTasksForCurrentDate.length;

			if (mainTasksCount >= MAX_MAIN_TASKS) {
				onIsMainChangeRef.current(false);
			} else if (originalIsMainRef.current) {
				onIsMainChangeRef.current(true);
			}
		};

		loadTasksForDate();
	}, [date, originalDate]);

	return { isLoadingTasks };
};
