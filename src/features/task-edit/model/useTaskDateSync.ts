import { useState, useEffect, useRef } from "react";
import { isSameDay } from "date-fns";
import { userStore } from "@/shared/model/userStore";
import { taskStore } from "@/shared/model/taskStore";
import { isTaskMain } from "@/shared/types/task";
import { MAX_MAIN_TASKS } from "@/shared/config/tasks";

interface UseTaskDateSyncOptions {
	originalDate?: Date;
	onAutoSwitch?: (shouldSwitch: boolean) => void;
}

interface UseTaskDateSyncResult {
	isLoadingTasks: boolean;
}

export const useTaskDateSync = (date: Date, options?: UseTaskDateSyncOptions): UseTaskDateSyncResult => {
	const { originalDate, onAutoSwitch } = options || {};
	const [isLoadingTasks, setIsLoadingTasks] = useState(false);
	const onAutoSwitchRef = useRef(onAutoSwitch);

	useEffect(() => {
		onAutoSwitchRef.current = onAutoSwitch;
	}, [onAutoSwitch]);

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

			const dateChanged = originalDate ? !isSameDay(date, originalDate) : true;

			if (dateChanged) {
				const tasksForNewDate = taskStore.getTasksForDate(date);
				const mainTasksForNewDate = tasksForNewDate.filter(isTaskMain);

				if (mainTasksForNewDate.length >= MAX_MAIN_TASKS && onAutoSwitchRef.current) {
					onAutoSwitchRef.current(true);
				}
			}
		};

		loadTasksForDate();
	}, [date, originalDate]);

	return { isLoadingTasks };
};
