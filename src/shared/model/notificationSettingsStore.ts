"use client";

import { makeAutoObservable, runInAction } from "mobx";
import {
	cancelAllTaskNotifications,
	getNotificationsTogglePreference,
	hasNotificationPermission,
	requestNotificationPermission,
	setNotificationsTogglePreference,
} from "@/shared/lib/notifications";

class NotificationSettingsStore {
	// Текущее состояние переключателя уведомлений в приложении (вкл/выкл).
	isNotificationsEnabled = false;
	// Флаг, что стор уже синхронизировал состояние с системным permission хотя бы один раз.
	isInitialized = false;

	constructor() {
		makeAutoObservable(this);
	}

	async initialize() {
		if (this.isInitialized) return;
		const granted = await hasNotificationPermission();
		const savedTogglePreference = getNotificationsTogglePreference();
		const isEnabled = granted && (savedTogglePreference ?? true);
		runInAction(() => {
			this.isNotificationsEnabled = isEnabled;
			this.isInitialized = true;
		});
	}

	async enableNotifications(): Promise<boolean> {
		const granted = await requestNotificationPermission();
		setNotificationsTogglePreference(granted);
		runInAction(() => {
			this.isNotificationsEnabled = granted;
			this.isInitialized = true;
		});
		return granted;
	}

	async disableNotifications() {
		setNotificationsTogglePreference(false);
		runInAction(() => {
			this.isNotificationsEnabled = false;
			this.isInitialized = true;
		});
		await cancelAllTaskNotifications();
	}
}

export const notificationSettingsStore = new NotificationSettingsStore();
