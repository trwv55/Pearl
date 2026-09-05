import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import {
	cancelTaskNotification,
	scheduleTaskNotification,
	setNotificationsTogglePreference,
} from "@/shared/lib/notifications";
import { makeTask, TEST_DATE } from "@/shared/testing/factories";

vi.mock("@capacitor/core", () => ({
	Capacitor: { isNativePlatform: vi.fn(() => true) },
}));
vi.mock("@capacitor/local-notifications", () => ({
	LocalNotifications: {
		schedule: vi.fn(async () => ({ notifications: [] })),
		cancel: vi.fn(async () => {}),
		checkPermissions: vi.fn(async () => ({ display: "granted" })),
		requestPermissions: vi.fn(async () => ({ display: "granted" })),
		getPending: vi.fn(async () => ({ notifications: [] })),
	},
}));

const scheduledId = (callIndex = 0) =>
	vi.mocked(LocalNotifications.schedule).mock.calls[callIndex][0].notifications[0].id;

beforeEach(() => {
	// Ruling A: фейковые таймеры включаем ДО setSystemTime.
	// 08:00 5 сентября 2026 — задачи на 10:00 ещё впереди.
	vi.useFakeTimers();
	vi.setSystemTime(new Date(2026, 8, 5, 8, 0));
});

afterEach(() => {
	// Подчищаем vi.stubGlobal("Notification", ...) из теста про не-нативную
	// платформу, чтобы он не протёк в соседние тесты этого файла.
	vi.unstubAllGlobals();
});

describe("scheduleTaskNotification", () => {
	it("планирует за 30 минут до времени задачи с ожидаемым текстом", async () => {
		const task = makeTask({ id: "abc", title: "Позвонить", emoji: "📞", date: TEST_DATE, time: 10 * 60 });
		await scheduleTaskNotification(task);

		expect(LocalNotifications.schedule).toHaveBeenCalledTimes(1);
		const notification = vi.mocked(LocalNotifications.schedule).mock.calls[0][0].notifications[0];
		expect(notification).toMatchObject({
			title: "📞 Позвонить",
			body: "Сегодня в 10:00",
			extra: { taskId: "abc" },
		});
		expect(notification.schedule?.at).toEqual(new Date(2026, 8, 5, 9, 30));
	});

	it("не планирует вне нативной платформы", async () => {
		vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
		// hasNotificationPermission() в не-нативной ветке смотрит на глобальный
		// Notification API, которого в jsdom нет — без стаба она сама вернёт
		// false и замаскирует проверку isNativePlatform в scheduleTaskNotification.
		// Даём «разрешено», чтобы тест действительно упирался в нужный guard.
		vi.stubGlobal("Notification", { permission: "granted" });
		await scheduleTaskNotification(makeTask({ time: 600 }));
		expect(LocalNotifications.schedule).not.toHaveBeenCalled();
	});

	it("не планирует без времени", async () => {
		// Если убрать проверку time === null, null арифметически даёт hours=0,
		// minutes=0 (полночь задачи). Сдвигаем "сейчас" на более раннее время,
		// чтобы эта полночь минус 30 минут была ещё впереди и не пряталась за
		// более поздней проверкой «момент уже прошёл» — иначе тест дискриминирует
		// не тот guard.
		vi.setSystemTime(new Date(2026, 8, 4, 20, 0));
		await scheduleTaskNotification(makeTask({ time: null }));
		expect(LocalNotifications.schedule).not.toHaveBeenCalled();
	});

	it("не планирует при выключенном тумблере", async () => {
		setNotificationsTogglePreference(false);
		await scheduleTaskNotification(makeTask({ time: 600 }));
		expect(LocalNotifications.schedule).not.toHaveBeenCalled();
	});

	it("не планирует без разрешения", async () => {
		vi.mocked(LocalNotifications.checkPermissions).mockResolvedValue({ display: "denied" as const });
		await scheduleTaskNotification(makeTask({ time: 600 }));
		expect(LocalNotifications.schedule).not.toHaveBeenCalled();
	});

	it("не планирует, если момент уведомления уже прошёл", async () => {
		vi.setSystemTime(new Date(2026, 8, 5, 9, 45));
		await scheduleTaskNotification(makeTask({ time: 600 }));
		expect(LocalNotifications.schedule).not.toHaveBeenCalled();
	});
});

describe("устойчивые id уведомлений", () => {
	it("одна задача — всегда один id, разные задачи — разные", async () => {
		await scheduleTaskNotification(makeTask({ id: "a", time: 600 }));
		await scheduleTaskNotification(makeTask({ id: "b", time: 600 }));
		await scheduleTaskNotification(makeTask({ id: "a", time: 600 }));

		expect(scheduledId(0)).toBe(scheduledId(2));
		expect(scheduledId(0)).not.toBe(scheduledId(1));
	});

	it("cancelTaskNotification использует тот же id, что и schedule", async () => {
		await scheduleTaskNotification(makeTask({ id: "a", time: 600 }));
		await cancelTaskNotification("a");

		expect(vi.mocked(LocalNotifications.cancel).mock.calls[0][0].notifications[0].id).toBe(scheduledId(0));
	});

	it("битый JSON в хранилище не роняет планирование", async () => {
		localStorage.setItem("pearl.notifications.idMap", "{oops");
		await scheduleTaskNotification(makeTask({ id: "a", time: 600 }));
		expect(LocalNotifications.schedule).toHaveBeenCalledTimes(1);
		expect(typeof scheduledId()).toBe("number");
	});
});
