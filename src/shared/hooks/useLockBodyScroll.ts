"use client";

import { useEffect } from "react";

/**
 * Хук для блокировки скролла страницы при открытии модального окна/попапа
 * @param isLocked - флаг, указывающий, нужно ли заблокировать скролл
 */
export const useLockBodyScroll = (isLocked: boolean): void => {
	useEffect(() => {
		if (isLocked) {
			document.body.classList.add("no-scroll");
		} else {
			document.body.classList.remove("no-scroll");
		}

		return () => {
			document.body.classList.remove("no-scroll");
		};
	}, [isLocked]);
};

