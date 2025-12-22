"use client";

import { signInWithEmailAndPassword, User } from "firebase/auth";
import { getFirebaseAuth } from "@/shared/lib/firebase";
import { toast } from "sonner";

export interface LoginError {
	code?: string;
	status?: number;
}

export type LoginResult = { success: true; user: User } | { success: false; error: string | null };

/**
 * Type guard для проверки успешного результата авторизации
 */
export const isLoginSuccess = (result: LoginResult): result is { success: true; user: User } => {
	return result.success === true;
};

/**
 * Обрабатывает ошибки авторизации
 * @param err - объект ошибки
 * @returns объект с результатом обработки ошибки
 */
export const handleLoginError = (err: unknown): LoginResult => {
	console.error("Login error:", err);

	const error = err as LoginError;
	let message = "Ошибка входа. Попробуйте ещё раз.";

	// Обработка ошибки 400 или соответствующих кодов Firebase
	if (
		error.status === 400 ||
		error.code === "auth/invalid-credential" ||
		error.code === "auth/wrong-password" ||
		error.code === "auth/user-not-found"
	) {
		message = "Неправильный логин или пароль. Попробуйте снова";
		toast.error(message);
		return { success: false, error: null }; // Возвращаем null, так как показываем только в тосте
	}

	toast.error(message);
	return { success: false, error: message };
};

/**
 * Выполняет авторизацию пользователя
 * @param email - email пользователя
 * @param password - пароль пользователя
 * @returns результат авторизации
 */
export const loginUser = async (email: string, password: string): Promise<LoginResult> => {
	try {
		const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
		return { success: true, user: cred.user };
	} catch (err: unknown) {
		return handleLoginError(err);
	}
};
