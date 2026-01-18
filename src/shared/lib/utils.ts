import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Преобразует время из минут в строку формата "HH:MM"
 * @param minutes - количество минут или null
 * @returns строка формата "HH:MM" или пустая строка, если minutes === null
 */
export const formatTimeFromMinutes = (minutes: number | null): string => {
	if (minutes === null) return "";
	const hours = Math.floor(minutes / 60)
		.toString()
		.padStart(2, "0");
	const mins = (minutes % 60).toString().padStart(2, "0");
	return `${hours}:${mins}`;
};
