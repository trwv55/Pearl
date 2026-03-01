"use client";

import { updateTask, type TaskPayload } from "@/shared/api/taskApi";
import type { Task } from "@/shared/types/task";

export interface EditTaskResult {
	taskId: string;
	data: Task | null;
	timestamp: string;
}

export const fetchUpdateTask = async (
	userId: string,
	taskId: string,
	payload: Partial<TaskPayload>,
): Promise<EditTaskResult> => {
	try {
		const taskData = await updateTask(userId, taskId, payload);

		return {
			taskId,
			data: taskData,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Ошибка при обновлении задачи:", error);
		throw error;
	}
};
