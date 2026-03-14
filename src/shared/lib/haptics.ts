import type { WebHaptics } from "web-haptics";

type TriggerInput = Parameters<WebHaptics["trigger"]>[0];
type TriggerOptions = Parameters<WebHaptics["trigger"]>[1];

export const HAPTIC_LIGHT: [TriggerInput, TriggerOptions] = [
	[{ duration: 15 }],
	{ intensity: 0.4 },
];

export const HAPTIC_SUCCESS: TriggerInput = [
    { duration: 30 },
    { delay: 60, duration: 40, intensity: 1 },
];

export const HAPTIC_ERROR: TriggerInput = [
	{ duration: 40, intensity: 0.7 },
	{ delay: 40, duration: 40, intensity: 0.7 },
	{ delay: 40, duration: 40, intensity: 0.9 },
	{ delay: 40, duration: 50, intensity: 0.6 },
];

export const HAPTIC_NUDGE: TriggerInput = [
	{ duration: 80, intensity: 0.8 },
	{ delay: 80, duration: 50, intensity: 0.3 },
];

export const HAPTIC_MEDIUM: [TriggerInput, TriggerOptions] = [
	[{ duration: 25 }],
	{ intensity: 0.7 },
];

