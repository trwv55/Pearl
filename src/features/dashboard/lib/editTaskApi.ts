"use client";

import { updateTask, type TaskPayload } from "@/entities/task/api";
import type { Task } from "@/entities/task/types";

export interface EditTaskResult {
	taskId: string;
	data: Task | null;
	timestamp: string;
}

/**
 * Генерирует моковые данные для payload (для тестирования)
 * @param payload - Частичные данные для обновления
 * @returns Полные моковые данные для payload
 */
const getMockPayload = (payload: Partial<TaskPayload>): Partial<TaskPayload> => {
	return {
		title: payload.title || "Обновленная задача (мок)",
		comment: payload.comment || "Обновленный комментарий (мок)",
		date: payload.date || new Date(),
		emoji: payload.emoji || "🐚",
		isMain: payload.isMain !== undefined ? payload.isMain : false,
		markerColor: payload.markerColor || "#3d00cb",
		time: payload.time !== undefined ? payload.time : null,
	};
};

/**
 * Обновляет задачу через REST API
 * Использует реальный запрос к Firebase, но с моковыми данными для payload (для тестирования)
 * @param userId - ID пользователя
 * @param taskId - ID задачи
 * @param payload - Данные для обновления задачи
 * @returns результат запроса с обновленными данными задачи и метаданными
 */
export const fetchUpdateTask = async (
	userId: string,
	taskId: string,
	payload: Partial<TaskPayload>,
): Promise<EditTaskResult> => {
	try {
		// Используем моковые данные для payload
		const mockPayload = getMockPayload(payload);

		console.log("🔄 Обновление задачи с моковыми данными:", {
			userId,
			taskId,
			originalPayload: payload,
			mockPayload,
		});

		// Реальный запрос к Firebase с моковыми данными
		const taskData = await updateTask(userId, taskId, mockPayload);

		return {
			taskId,
			data: taskData,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Ошибка при обновлении задачи через REST API:", error);
		throw error;
	}
};

/**
 * Обновляет задачу и выводит результат в консоль
 * @param userId - ID пользователя
 * @param taskId - ID задачи
 * @param payload - Данные для обновления задачи
 */
export const editTask = async (userId: string, taskId: string, payload: Partial<TaskPayload>): Promise<void> => {
	if (!userId) {
		console.error("Нет данных пользователя");
		return;
	}

	if (!taskId) {
		console.error("Нет ID задачи");
		return;
	}

	try {
		const result = await fetchUpdateTask(userId, taskId, payload);
		console.log("Результат обновления задачи через REST API:", result);
	} catch (error) {
		console.error("Ошибка при обновлении задачи через REST API:", error);
	}
};
