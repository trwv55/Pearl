"use client";

import { useLayoutEffect } from "react";
import styles from "./AuthLayout.module.css";

type Props = {
	children: React.ReactNode;
};

export const AuthLayout = ({ children }: Props) => {
	useLayoutEffect(() => {
		// Добавляем стили для html и body на страницах авторизации
		// useLayoutEffect выполняется синхронно ДО отрисовки браузером,
		// что предотвращает видимое мигание (FOUC) с полосами
		const html = document.documentElement;
		const body = document.body;

		const originalHtmlStyle = html.style.cssText;
		const originalBodyStyle = body.style.cssText;

		// Убираем все отступы и устанавливаем высоту
		html.style.height = "100%";
		html.style.margin = "0";
		html.style.padding = "0";
		html.style.overflow = "hidden";

		body.style.height = "100%";
		body.style.margin = "0";
		body.style.padding = "0";
		body.style.overflow = "hidden";

		return () => {
			// Восстанавливаем оригинальные стили при размонтировании
			html.style.cssText = originalHtmlStyle;
			body.style.cssText = originalBodyStyle;
		};
	}, []);

	return <div className={styles.wrap}>{children}</div>;
};
