"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { userStore } from "@/stores/userStore";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
	const router = useRouter();

	useEffect(() => {
		// если пользователь НЕ авторизован
		if (!userStore.isLoading && !userStore.user) {
			router.replace("/auth");
		}
	}, [router, userStore.user, userStore.isLoading]);

	// Пока идёт проверка авторизации – ничего не показываем
	if (userStore.isLoading) {
		console.log("загрузкаа");
	}

	// Если не авторизован – ничего не рендерим (редирект выше)
	if (!userStore.user) {
		console.log("загрузкаа");
	}

	return <>{children}</>;
};
