"use client";

import { useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import type { WebHaptics } from "web-haptics";
import { useWebHaptics } from "web-haptics/react";
import {
	HAPTIC_ERROR,
	HAPTIC_LIGHT,
	HAPTIC_MEDIUM,
	HAPTIC_NUDGE,
	HAPTIC_SUCCESS,
} from "@/shared/lib/haptics";

type TriggerInput = Parameters<WebHaptics["trigger"]>[0];
type TriggerOptions = Parameters<WebHaptics["trigger"]>[1];

// В WKWebView (Capacitor) не работает ни navigator.vibrate, ни safari-хаптик
// switch-инпута, на который полагается web-haptics — поэтому на нативной
// платформе пресеты маппятся на системные хаптики iOS.
const NATIVE_ACTIONS = new Map<unknown, () => Promise<void>>([
	[HAPTIC_LIGHT[0], () => Haptics.impact({ style: ImpactStyle.Light })],
	[HAPTIC_MEDIUM[0], () => Haptics.impact({ style: ImpactStyle.Medium })],
	[HAPTIC_SUCCESS, () => Haptics.notification({ type: NotificationType.Success })],
	[HAPTIC_ERROR, () => Haptics.notification({ type: NotificationType.Error })],
	[HAPTIC_NUDGE, () => Haptics.notification({ type: NotificationType.Warning })],
]);

export function useHaptics() {
	const { trigger: webTrigger } = useWebHaptics();

	const trigger = useCallback(
		async (input?: TriggerInput, options?: TriggerOptions) => {
			if (!Capacitor.isNativePlatform()) {
				await webTrigger(input, options);
				return;
			}

			try {
				const action = NATIVE_ACTIONS.get(input);
				if (action) {
					await action();
				} else {
					await Haptics.impact({ style: ImpactStyle.Medium });
				}
			} catch {
				// нет хаптик-движка (симулятор, iPad) — молча пропускаем
			}
		},
		[webTrigger],
	);

	return { trigger };
}
