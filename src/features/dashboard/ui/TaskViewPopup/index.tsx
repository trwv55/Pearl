"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import clsx from "clsx";
import type { Task } from "@/entities/task/types";
import { Edit, Copy, Trash2 } from "lucide-react";
import { TaskCalendar } from "@/shared/assets/icons/TaskCalendar";
import { TaskClock } from "@/shared/assets/icons/TaskClock";
import { TaskComment } from "@/shared/assets/icons/TaskComment";
import { TaskGradientEllipse } from "@/shared/assets/icons/TaskGradientEllipse";
import buttonStyles from "@/shared/ui/button.module.css";
import styles from "./TaskViewPopup.module.css";

interface TaskViewPopupProps {
	task: Task | null;
	isVisible: boolean;
	onClose: () => void;
}

export const TaskViewPopup: React.FC<TaskViewPopupProps> = ({ task, isVisible, onClose }) => {
	const dateLabel = useMemo(() => {
		if (!task) return "";
		return task.date.toLocaleDateString("ru-RU", {
			weekday: "long",
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	}, [task]);

	const timeLabel = useMemo(() => {
		if (!task || task.time === null) return "";
		const hours = Math.floor(task.time / 60)
			.toString()
			.padStart(2, "0");
		const minutes = (task.time % 60).toString().padStart(2, "0");
		return `${hours}:${minutes}`;
	}, [task]);

	const timeEndLabel = useMemo(() => {
		if (!task || task.time === null) return null;
		// Предполагаем, что задача длится 1 час, если нет данных о длительности
		const endTime = task.time + 60;
		const hours = Math.floor(endTime / 60)
			.toString()
			.padStart(2, "0");
		const minutes = (endTime % 60).toString().padStart(2, "0");
		return `${hours}:${minutes}`;
	}, [task]);

	const gradientColor = useMemo(() => task?.markerColor || "#96C937", [task?.markerColor]);

	const actionIcons = useMemo(
		() => [
			{ icon: Edit, label: "Редактировать", color: "#7C3AED" },
			{ icon: Copy, label: "Дублировать", color: "#7C3AED" },
			{ icon: Trash2, label: "Удалить", color: "#EF4444" },
		],
		[],
	);

	const startYRef = useRef<number | null>(null);
	const POINTER_THRESHOLD = 60;

	const handlePointerUp = useCallback(
		(event: PointerEvent) => {
			if (startYRef.current === null) return;
			const delta = event.clientY - startYRef.current;
			startYRef.current = null;
			window.removeEventListener("pointerup", handlePointerUp);
			if (delta >= POINTER_THRESHOLD) {
				onClose();
			}
		},
		[onClose],
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
		return () => {
			window.removeEventListener("pointerup", handlePointerUp);
		};
	}, [handlePointerUp]);

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
			<section className={clsx(styles.sheet, isVisible && styles.sheetVisible)} role="dialog">
				<div className={styles.gradientTop}>
					<TaskGradientEllipse
						className={styles.gradientEllipse}
						color={gradientColor}
						uniqueId={task?.id || "default"}
					/>
					<div className={styles.handleArea}>
						<div className={styles.handle} onPointerDown={handlePointerDown} />
					</div>
				</div>
				<div className={styles.header}>
					<div className={styles.gradientAvatar}>
						<span role="img" aria-label="Значок задачи">
							{task.emoji || "✨"}
						</span>
					</div>
					<h2 className={styles.title}>{task.title}</h2>
				</div>
				<div className={styles.metaSection}>
					{dateLabel && (
						<div className={styles.metaItem}>
							<TaskCalendar className={styles.metaIcon} />
							<span>{dateLabel}</span>
						</div>
					)}
					{timeLabel && (
						<div className={styles.metaItem}>
							<TaskClock className={styles.metaIcon} />
							<span>
								{timeLabel}
								{timeEndLabel && ` — ${timeEndLabel}`}
							</span>
						</div>
					)}
				</div>
				<div className={styles.commentSection}>
					<div className={styles.commentHeader}>
						<TaskComment className={styles.commentIcon} />
						<span className={styles.commentTitle}>Комментарий:</span>
					</div>
					<div className={styles.commentText}>{task.comment || "Описание отсутствует"}</div>
				</div>
				<div className={styles.actionIcons}>
					{actionIcons.map((action, index) => {
						const IconComponent = action.icon;
						return (
							<button key={index} type="button" className={styles.actionIconButton} aria-label={action.label}>
								<div
									className={styles.actionIconWrapper}
									style={{ "--icon-color": action.color } as React.CSSProperties}
								>
									<IconComponent className={styles.actionIcon} size={20} />
								</div>
							</button>
						);
					})}
				</div>
				<footer className={styles.footer}>
					<button
						type="button"
						onClick={onClose}
						className={buttonStyles.mainDashboardButton}
						aria-label="Задача выполнена"
					>
						Выполнена
					</button>
				</footer>
			</section>
		</div>
	);
};
