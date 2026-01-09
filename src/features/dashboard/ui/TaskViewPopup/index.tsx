"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import type { Task } from "@/entities/task/types";
import { Edit, Copy, Trash2 } from "lucide-react";
import { TaskCalendar } from "@/shared/assets/icons/TaskCalendar";
import { TaskClock } from "@/shared/assets/icons/TaskClock";
import { TaskComment } from "@/shared/assets/icons/TaskComment";
import { TaskGradientEllipse } from "@/shared/assets/icons/TaskGradientEllipse";
import { SheetHandle } from "@/shared/ui/SheetHandle";
import { useLockBodyScroll } from "@/shared/hooks/useLockBodyScroll";
import { useTaskViewPopup } from "@/features/dashboard/hooks/useTaskViewPopup";
import buttonStyles from "@/shared/ui/button.module.css";
import styles from "./TaskViewPopup.module.css";
import { userStore } from "@/entities/user/store";
import { taskStore } from "@/entities/task/store";
import { statsStore } from "@/entities/stats/store";
import { startOfWeek } from "date-fns";
import { toast } from "sonner";
import { formatTimeFromMinutes } from "@/shared/lib/utils";

interface TaskViewPopupProps {
	task: Task | null;
	isVisible: boolean;
	onClose: () => void;
}

export const TaskViewPopup: React.FC<TaskViewPopupProps> = ({ task, isVisible, onClose }) => {
	const { openEditTask, openDuplicateTask } = useTaskViewPopup();
	const editTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
		if (!task) return "";
		return formatTimeFromMinutes(task.time);
	}, [task]);

	const timeEndLabel = useMemo(() => {
		if (!task || task.time === null) return null;
		// Предполагаем, что задача длится 1 час, если нет данных о длительности
		const endTime = task.time + 60;
		const hours = (Math.floor(endTime / 60) % 24).toString().padStart(2, "0");
		const minutes = (endTime % 60).toString().padStart(2, "0");
		return `${hours}:${minutes}`;
	}, [task]);

	const gradientColor = useMemo(() => task?.markerColor || "#96C937", [task?.markerColor]);

	const handleComplete = useCallback(async () => {
		if (!task) return;
		const uid = userStore.user?.uid;
		if (!uid) {
			toast.error("Нет данных пользователя");
			return;
		}

		try {
			await taskStore.toggleCompletion(uid, task.id);
			const weekStart = startOfWeek(taskStore.selectedDate, { weekStartsOn: 1 });
			statsStore.fetchWeekStats(uid, weekStart);
			onClose();
		} catch (error) {
			console.error("Ошибка при выполнении задачи:", error);
		}
	}, [task, onClose]);

	const handleDelete = useCallback(() => {
		if (!task) return;
		const uid = userStore.user?.uid;
		if (!uid) {
			toast.error("Нет данных пользователя");
			return;
		}

		onClose();

		// Выполняем удаление после небольшой задержки для завершения анимации закрытия
		setTimeout(() => {
			const weekStart = startOfWeek(taskStore.selectedDate, { weekStartsOn: 1 });
			// Обновляем статистику после фактического удаления из Firebase
			taskStore.deleteWithUndo(uid, task, 4000, () => {
				statsStore.fetchWeekStats(uid, weekStart);
			});
		}, 250);
	}, [task, onClose]);

	const handleEdit = useCallback(() => {
		if (!task) return;

		// Очищаем предыдущий таймер, если он существует (защита от множественных кликов)
		if (editTimerRef.current) {
			clearTimeout(editTimerRef.current);
		}

		onClose();

		// Открываем попап редактирования после небольшой задержки для завершения анимации закрытия
		editTimerRef.current = setTimeout(() => {
			openEditTask(task);
			editTimerRef.current = null;
		}, 250);
	}, [task, onClose, openEditTask]);

	// Очищаем таймер при размонтировании компонента
	useEffect(() => {
		return () => {
			if (editTimerRef.current) {
				clearTimeout(editTimerRef.current);
			}
		};
	}, []);

	const handleDuplicate = useCallback(() => {
		if (!task) return;

		onClose();
		openDuplicateTask(task);
	}, [task, onClose, openDuplicateTask]);

	const actionIcons = useMemo(
		() => [
			{ icon: Edit, label: "Редактировать", color: "#7C3AED" },
			{ icon: Copy, label: "Дублировать", color: "#7C3AED" },
			{ icon: Trash2, label: "Удалить", color: "#EF4444" },
		],
		[],
	);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		},
		[onClose],
	);

	useEffect(() => {
		if (!isVisible) return;

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isVisible, handleKeyDown]);

	// Блокировка скролла страницы при открытии попапа
	useLockBodyScroll(isVisible);

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
					<SheetHandle onDragEnd={onClose} />
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
				{task.comment && task.comment.trim() && (
					<div className={styles.commentSection}>
						<div className={styles.commentHeader}>
							<TaskComment className={styles.commentIcon} />
							<span className={styles.commentTitle}>Комментарий:</span>
						</div>
						<div className={styles.commentText}>{task.comment}</div>
					</div>
				)}
				<div className={styles.actionIcons}>
					{actionIcons.map((action, index) => {
						const IconComponent = action.icon;
						const isDelete = action.label === "Удалить";
						const isEdit = action.label === "Редактировать";
						const isDuplicate = action.label === "Дублировать";
						return (
							<button
								key={index}
								type="button"
								className={styles.actionIconButton}
								aria-label={action.label}
								onClick={isDelete ? handleDelete : isEdit ? handleEdit : isDuplicate ? handleDuplicate : undefined}
							>
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
				{!task.isCompleted && (
					<footer className={styles.footer}>
						<button
							type="button"
							onClick={handleComplete}
							className={buttonStyles.mainDashboardButton}
							aria-label="Задача выполнена"
						>
							Выполнена
						</button>
					</footer>
				)}
			</section>
		</div>
	);
};
