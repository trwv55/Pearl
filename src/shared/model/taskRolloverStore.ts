"use client";

import { makeAutoObservable, runInAction } from "mobx";
import { format, startOfDay } from "date-fns";

const ENABLED_KEY = "pearl.rollover.enabled";
const ENABLED_DATE_KEY = "pearl.rollover.enabledDate";

// Настройка «Продление задач». Хранит факт включения и ДАТУ включения:
// переносятся только невыполненные главные задачи с дней >= этой даты —
// то есть «только с этого момента», прошлые просрочки не подметаются.
class TaskRolloverStore {
	isEnabled = false;
	enabledDate: string | null = null; // yyyy-MM-dd, локальная дата включения
	isInitialized = false;

	constructor() {
		makeAutoObservable(this);
	}

	initialize() {
		if (this.isInitialized || typeof window === "undefined") return;
		const enabled = window.localStorage.getItem(ENABLED_KEY) === "true";
		const enabledDate = window.localStorage.getItem(ENABLED_DATE_KEY);
		runInAction(() => {
			this.isEnabled = enabled;
			this.enabledDate = enabled ? enabledDate : null;
			this.isInitialized = true;
		});
	}

	enable() {
		const today = format(startOfDay(new Date()), "yyyy-MM-dd");
		if (typeof window !== "undefined") {
			window.localStorage.setItem(ENABLED_KEY, "true");
			window.localStorage.setItem(ENABLED_DATE_KEY, today);
		}
		runInAction(() => {
			this.isEnabled = true;
			this.enabledDate = today;
			this.isInitialized = true;
		});
	}

	disable() {
		if (typeof window !== "undefined") {
			window.localStorage.setItem(ENABLED_KEY, "false");
			window.localStorage.removeItem(ENABLED_DATE_KEY);
		}
		runInAction(() => {
			this.isEnabled = false;
			this.enabledDate = null;
			this.isInitialized = true;
		});
	}
}

export const taskRolloverStore = new TaskRolloverStore();
