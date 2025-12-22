"use client";

import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "../firebase";
import { taskStore } from "@/entities/task/store";

export const logout = async () => {
	localStorage.removeItem("splashShown"); // Чтобы показывать splash screen при входе
	taskStore.clearCache(); // Очищаем кеш задач при выходе
	taskStore.setSelectedDate(new Date()); // Чтобы при входе показывался текущий день
	try {
		return await signOut(getFirebaseAuth());
	} catch (error) {
		console.error("Ошибка при выходе из приложения:", error);
	}
};
