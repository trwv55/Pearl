"use client";

import { useLayoutEffect } from "react";
import "./auth-layout.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	useLayoutEffect(() => {
		// Добавляем data-атрибут для применения CSS стилей синхронно до отрисовки
		document.documentElement.setAttribute("data-auth-page", "");
		document.body.setAttribute("data-auth-page", "");

		return () => {
			document.documentElement.removeAttribute("data-auth-page");
			document.body.removeAttribute("data-auth-page");
		};
	}, []);

	return <>{children}</>;
}
