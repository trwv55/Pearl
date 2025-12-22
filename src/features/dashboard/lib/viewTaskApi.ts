"use client";

import { getTaskById } from "@/entities/task/api";
import type { Task } from "@/entities/task/types";

export interface ViewTaskResult {
	taskId: string;
	data: Task | null;
	timestamp: string;
}

/**
 * Получает задачу из Firebase и возвращает результат с метаданными
 * @param userId - ID пользователя
 * @param taskId - ID задачи
 * @returns результат запроса с данными задачи и метаданными
 */
export const fetchTaskById = async (userId: string, taskId: string): Promise<ViewTaskResult> => {
	try {
		const taskData = await getTaskById(userId, taskId);
		return {
			taskId,
			data: taskData,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Ошибка при получении задачи из Firebase:", error);
		throw error;
	}
};

/**
 * Получает задачу и выводит результат в консоль
 * @param userId - ID пользователя
 * @param taskId - ID задачи
 */
// export const viewTask = async (userId: string, taskId: string): Promise<void> => {
// 	if (!userId) {
// 		console.error("Нет данных пользователя");
// 		return;
// 	}

// 	try {
// 		const result = await fetchTaskById(userId, taskId);
// 		console.log("Результат запроса к Firebase для задачи:", result);
// 	} catch (error) {
// 		console.error("Ошибка при получении задачи из Firebase:", error);
// 	}
// };
