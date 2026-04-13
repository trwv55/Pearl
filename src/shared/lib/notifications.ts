import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import type { Task } from "@/shared/types/task";

const NOTIFICATION_TOGGLE_STORAGE_KEY = "pearl.notifications.enabled";

function taskIdToNumber(taskId: string): number {
	let hash = 0;
	for (let i = 0; i < taskId.length; i++) {
		hash = ((hash << 5) - hash) + taskId.charCodeAt(i);
		hash = hash & hash;
	}
	return Math.abs(hash) || 1;
}

export function getNotificationsTogglePreference(): boolean | null {
	if (typeof window === "undefined") return null;
	const value = window.localStorage.getItem(NOTIFICATION_TOGGLE_STORAGE_KEY);
	if (value === null) return null;
	return value === "true";
}

export function setNotificationsTogglePreference(enabled: boolean): void {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(NOTIFICATION_TOGGLE_STORAGE_KEY, String(enabled));
}

export async function hasNotificationPermission(): Promise<boolean> {
	if (Capacitor.isNativePlatform()) {
		try {
			const { display } = await LocalNotifications.checkPermissions();
			return display === "granted";
		} catch (err) {
			console.warn("Не удалось проверить разрешение на уведомления", err);
			return false;
		}
	}

	if (typeof Notification !== "undefined") {
		return Notification.permission === "granted";
	}

	return false;
}

export async function requestNotificationPermission(): Promise<boolean> {
	if (Capacitor.isNativePlatform()) {
		try {
			const { display } = await LocalNotifications.checkPermissions();
			if (display !== "granted") {
				await LocalNotifications.requestPermissions();
			}
		} catch (err) {
			console.warn("Не удалось запросить разрешение на уведомления", err);
		}
		return hasNotificationPermission();
	}

	if (typeof Notification !== "undefined" && Notification.permission === "default") {
		try {
			const result = await Notification.requestPermission();
			return result === "granted";
		} catch (err) {
			console.warn("Не удалось запросить разрешение на браузерные уведомления", err);
			return false;
		}
	}

	return hasNotificationPermission();
}

export async function cancelAllTaskNotifications(): Promise<void> {
	if (!Capacitor.isNativePlatform()) return;
	try {
		const pending = await LocalNotifications.getPending();
		if (pending.notifications.length === 0) return;

		await LocalNotifications.cancel({
			notifications: pending.notifications.map((notification) => ({ id: notification.id })),
		});
	} catch (err) {
		console.warn("Не удалось отменить все уведомления", err);
	}
}

export async function scheduleTaskNotification(task: Task): Promise<void> {
	const isEnabledInApp = getNotificationsTogglePreference() ?? true;
	if (!isEnabledInApp) return;
	if (!(await hasNotificationPermission())) return;
	if (!Capacitor.isNativePlatform()) return;
	if (task.time === null) return;

	const hours = Math.floor(task.time / 60);
	const minutes = task.time % 60;

	const taskDate = task.date instanceof Date ? task.date : new Date(task.date);
	const taskAt = new Date(taskDate);
	taskAt.setHours(hours, minutes, 0, 0);

	// const notifyAt = new Date(taskAt.getTime() - 30 * 60 * 1000);
    const notifyAt = new Date(taskAt.getTime() - 10 * 1000); 

	if (notifyAt <= new Date()) return;

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
