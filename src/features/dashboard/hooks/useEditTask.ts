"use client";

import { useState, useCallback } from "react";
import { fetchUpdateTask, EditTaskResult } from "../lib/editTaskApi";
import type { TaskPayload } from "@/entities/task/api";

interface UseEditTaskReturn {
	isLoading: boolean;
	error: Error | null;
	editTask: (userId: string, taskId: string, payload: Partial<TaskPayload>) => Promise<EditTaskResult | null>;
	resetError: () => void;
}

/**
 * Кастомный хук для редактирования задачи
 * @returns объект с состоянием загрузки, ошибкой и функцией для обновления задачи
 */
export const useEditTask = (): UseEditTaskReturn => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const editTask = useCallback(
		async (userId: string, taskId: string, payload: Partial<TaskPayload>): Promise<EditTaskResult | null> => {
			setIsLoading(true);
			setError(null);

			try {
				const result = await fetchUpdateTask(userId, taskId, payload);
				setIsLoading(false);
				return result;
			} catch (err) {
				const error = err instanceof Error ? err : new Error("Неизвестная ошибка при обновлении задачи");
				setError(error);
				setIsLoading(false);
				console.error("Ошибка в useEditTask:", error);
				return null;
			}
		},
		[],
	);

	const resetError = useCallback(() => {
		setError(null);
	}, []);

	return {
		isLoading,
		error,
		editTask,
		resetError,
	};
};
