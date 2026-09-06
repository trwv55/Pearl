import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationSettingsStore } from "@/shared/model/notificationSettingsStore";
import {
	cancelAllTaskNotifications,
	getNotificationsTogglePreference,
	hasNotificationPermission,
	requestNotificationPermission,
	setNotificationsTogglePreference,
} from "@/shared/lib/notifications";

vi.mock("@/shared/lib/notifications", () => ({
	cancelAllTaskNotifications: vi.fn(async () => {}),
	getNotificationsTogglePreference: vi.fn((): boolean | null => null),
	hasNotificationPermission: vi.fn(async () => true),
	requestNotificationPermission: vi.fn(async () => true),
	setNotificationsTogglePreference: vi.fn(),
}));

let store: NotificationSettingsStore;

beforeEach(() => {
	store = new NotificationSettingsStore();
});

describe("initialize", () => {
	it("включён, если есть разрешение и тумблер не выключен явно", async () => {
		await store.initialize();
		expect(store.isNotificationsEnabled).toBe(true);
		expect(store.isInitialized).toBe(true);
	});

	it("выключен без разрешения", async () => {
		vi.mocked(hasNotificationPermission).mockResolvedValue(false);
		await store.initialize();
		expect(store.isNotificationsEnabled).toBe(false);
	});

	it("выключен, если тумблер сохранён как false", async () => {
		vi.mocked(getNotificationsTogglePreference).mockReturnValue(false);
		await store.initialize();
		expect(store.isNotificationsEnabled).toBe(false);
	});

	it("идемпотентен", async () => {
		await store.initialize();
		await store.initialize();
		expect(hasNotificationPermission).toHaveBeenCalledTimes(1);
	});
});

describe("enableNotifications / disableNotifications", () => {
	it("enable сохраняет результат запроса разрешения", async () => {
		vi.mocked(requestNotificationPermission).mockResolvedValue(false);
		await expect(store.enableNotifications()).resolves.toBe(false);
		expect(setNotificationsTogglePreference).toHaveBeenCalledWith(false);
		expect(store.isNotificationsEnabled).toBe(false);
	});

	it("disable пишет false и отменяет все уведомления", async () => {
		await store.disableNotifications();
		expect(setNotificationsTogglePreference).toHaveBeenCalledWith(false);
		expect(cancelAllTaskNotifications).toHaveBeenCalledTimes(1);
		expect(store.isNotificationsEnabled).toBe(false);
	});
});
