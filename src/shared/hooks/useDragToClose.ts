"use client";

import React, { useCallback, useEffect, useRef } from "react";

/**
 * Хук для закрытия bottom sheet свайпом вниз по всей области листа.
 * @param onClose - функция закрытия попапа
 * @param threshold - минимальное смещение вниз в px для срабатывания (по умолчанию 60)
 */
export const useDragToClose = (onClose: () => void, threshold = 60) => {
	const dragStartYRef = useRef<number | null>(null);

	const handleSwipeEnd = useCallback(
		(event: PointerEvent) => {
			if (dragStartYRef.current === null) return;
			const delta = event.clientY - dragStartYRef.current;
			dragStartYRef.current = null;
			window.removeEventListener("pointerup", handleSwipeEnd);
			if (delta >= threshold) {
				onClose();
			}
		},
		[onClose, threshold],
	);

	const handleSheetPointerDown = useCallback(
		(event: React.PointerEvent<HTMLElement>) => {
			dragStartYRef.current = event.clientY;
			window.addEventListener("pointerup", handleSwipeEnd);
		},
		[handleSwipeEnd],
	);

	useEffect(() => {
		return () => {
			window.removeEventListener("pointerup", handleSwipeEnd);
		};
	}, [handleSwipeEnd]);

	return handleSheetPointerDown;
};
