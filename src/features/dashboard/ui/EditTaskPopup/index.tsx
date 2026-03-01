"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { toast } from "sonner";
import type { Task } from "@/entities/task/types";
import { SheetHandle } from "@/shared/ui/SheetHandle";
import { TaskGradientEllipse } from "@/shared/assets/icons/TaskGradientEllipse";
import { useLockBodyScroll } from "@/shared/hooks/useLockBodyScroll";
import EditTaskForm from "./EditTaskForm";
import styles from "./EditTaskPopup.module.css";

interface EditTaskPopupProps {
	task: Task | null;
	isVisible: boolean;
	onClose: () => void;
}

export const EditTaskPopup: React.FC<EditTaskPopupProps> = ({ task, isVisible, onClose }) => {
	const gradientColor = useMemo(() => task?.markerColor || "#3d00cb", [task?.markerColor]);
	const [isAnimated, setIsAnimated] = React.useState(false);
	const dragStartYRef = useRef<number | null>(null);

	const handleSwipeEnd = useCallback(
		(event: PointerEvent) => {
			if (dragStartYRef.current === null) return;
			const delta = event.clientY - dragStartYRef.current;
			dragStartYRef.current = null;
			window.removeEventListener("pointerup", handleSwipeEnd);
			if (delta >= 60) {
				onClose();
			}
		},
		[onClose],
	);

	const handleSheetPointerDown = useCallback(
		(event: React.PointerEvent<HTMLElement>) => {
			dragStartYRef.current = event.clientY;
			window.addEventListener("pointerup", handleSwipeEnd);
		},
		[handleSwipeEnd],
	);

	useEffect(() => {
		if (!isVisible) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isVisible, onClose]);

	useEffect(() => {
		if (isVisible && !task) {
			toast.error("Задача не найдена");
			onClose();
		}
	}, [isVisible, task, onClose]);

	// Блокировка скролла страницы при открытии попапа
	useLockBodyScroll(isVisible);

	useEffect(() => {
		return () => {
			window.removeEventListener("pointerup", handleSwipeEnd);
		};
	}, [handleSwipeEnd]);

	// Задержка для анимации появления
	useEffect(() => {
		if (isVisible && task) {
			setIsAnimated(false);
			// Даем браузеру время применить начальное состояние перед анимацией
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					setIsAnimated(true);
				});
			});
		} else {
			setIsAnimated(false);
		}
	}, [isVisible, task]);

	if (!task) {
		return null;
	}

	return createPortal(
		<div
			className={clsx(styles.overlay, isVisible && styles.overlayVisible)}
			onClick={(event) => {
				if (event.target === event.currentTarget) {
					onClose();
				}
			}}
		>
			<section className={clsx(styles.sheet, isAnimated && styles.sheetVisible)} role="dialog" onPointerDown={handleSheetPointerDown}>
				<div className={styles.gradientTop}>
					<TaskGradientEllipse
						className={styles.gradientEllipse}
						color={gradientColor}
						uniqueId={task.id || "edit-popup"}
					/>
					<SheetHandle />
				</div>
				<div className={styles.header}>
					<h2 className={styles.title}>Редактируем задачу</h2>
				</div>
				<div className={styles.content}>
					<EditTaskForm task={task} onClose={onClose} />
				</div>
			</section>
		</div>,
		document.body,
	);
};
