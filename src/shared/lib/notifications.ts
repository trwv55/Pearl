import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import type { Task } from "@/shared/types/task";

function taskIdToNumber(taskId: string): number {
	let hash = 0;
	for (let i = 0; i < taskId.length; i++) {
		hash = ((hash << 5) - hash) + taskId.charCodeAt(i);
		hash = hash & hash;
	}
	return Math.abs(hash) || 1;
}

export async function requestNotificationPermission(): Promise<void> {
	if (!Capacitor.isNativePlatform()) return;
	try {
		const { display } = await LocalNotifications.checkPermissions();
		if (display !== "granted") {
			await LocalNotifications.requestPermissions();
		}
	} catch (err) {
		console.warn("Не удалось запросить разрешение на уведомления", err);
	}
}

export async function scheduleTaskNotification(task: Task): Promise<void> {
	if (!Capacitor.isNativePlatform()) return;
	if (task.time === null) return;

	const hours = Math.floor(task.time / 60);
	const minutes = task.time % 60;

	const taskDate = task.date instanceof Date ? task.date : new Date(task.date);
	const taskAt = new Date(taskDate);
	taskAt.setHours(hours, minutes, 0, 0);

	// const notifyAt = new Date(taskAt.getTime() - 30 * 60 * 1000);
    const notifyAt = new Date(taskAt.getTime() - 10 * 1000); 

	// if (notifyAt <= new Date()) return;

	const timeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

	try {
		await LocalNotifications.schedule({
			notifications: [
				{
					id: taskIdToNumber(task.id),
					title: `${task.emoji} ${task.title}`,
					body: `Сегодня в ${timeStr}`,
					schedule: { at: notifyAt },
					extra: { taskId: task.id },
				},
			],
		});
	} catch (err) {
		console.warn("Не удалось запланировать уведомление", err);
	}
}

export async function cancelTaskNotification(taskId: string): Promise<void> {
	if (!Capacitor.isNativePlatform()) return;
	try {
		await LocalNotifications.cancel({
			notifications: [{ id: taskIdToNumber(taskId) }],
		});
	} catch (err) {
		console.warn("Не удалось отменить уведомление", err);
	}
}
