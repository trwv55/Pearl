"use client";

import React, { useEffect, useMemo } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import type { Task } from "@/entities/task/types";
import { SheetHandle } from "@/shared/ui/SheetHandle";
import { TaskGradientEllipse } from "@/shared/assets/icons/TaskGradientEllipse";
import { useLockBodyScroll } from "@/shared/hooks/useLockBodyScroll";
import DuplicateTaskForm from "./DuplicateTaskForm";
import styles from "./DuplicateTaskPopup.module.css";

interface DuplicateTaskPopupProps {
	task: Task | null;
	isVisible: boolean;
	onClose: () => void;
}

export const DuplicateTaskPopup: React.FC<DuplicateTaskPopupProps> = ({ task, isVisible, onClose }) => {
	const gradientColor = useMemo(() => task?.markerColor || "#3d00cb", [task?.markerColor]);
	const [isAnimated, setIsAnimated] = React.useState(false);

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

	return (
		<div
			className={clsx(styles.overlay, isVisible && styles.overlayVisible)}
			onClick={(event) => {
				if (event.target === event.currentTarget) {
					onClose();
				}
			}}
		>
			<section className={clsx(styles.sheet, isAnimated && styles.sheetVisible)} role="dialog">
				<div className={styles.gradientTop}>
					<TaskGradientEllipse
						className={styles.gradientEllipse}
						color={gradientColor}
						uniqueId={task.id || "duplicate-popup"}
					/>
					<SheetHandle onDragEnd={onClose} />
				</div>
				<div className={styles.header}>
					<h2 className={styles.title}>Дублируем задачу</h2>
				</div>
				<div className={styles.content}>
					<DuplicateTaskForm task={task} onClose={onClose} />
				</div>
			</section>
		</div>
	);
};

