"use client";

import React, { useCallback, useEffect, useRef } from "react";
import clsx from "clsx";
import styles from "./SheetHandle.module.css";

interface SheetHandleProps {
	onDragEnd?: () => void;
	threshold?: number;
	className?: string;
}

export const SheetHandle: React.FC<SheetHandleProps> = ({
	onDragEnd,
	threshold = 60,
	className,
}) => {
	const startYRef = useRef<number | null>(null);

	const handlePointerUp = useCallback(
		(event: PointerEvent) => {
			if (startYRef.current === null) return;
			const delta = event.clientY - startYRef.current;
			startYRef.current = null;
			window.removeEventListener("pointerup", handlePointerUp);
			if (delta >= threshold && onDragEnd) {
				onDragEnd();
			}
		},
		[threshold, onDragEnd],
	);

	const handlePointerDown = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			startYRef.current = event.clientY;
			event.currentTarget.setPointerCapture?.(event.pointerId);
			window.addEventListener("pointerup", handlePointerUp);
		},
		[handlePointerUp],
	);

	useEffect(() => {
		return () => {
			window.removeEventListener("pointerup", handlePointerUp);
		};
	}, [handlePointerUp]);

	return (
		<div
			className={clsx(styles.handleArea, className)}
			onPointerDown={handlePointerDown}
		>
			<button className={styles.handle} aria-label="Перетащить для закрытия" />
		</div>
	);
};

