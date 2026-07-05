"use client";

import React, { useCallback, useEffect, useRef, useMemo } from "react";
import Popup from "reactjs-popup";
import { useDragToClose } from "@/shared/hooks/useDragToClose";
import clsx from "clsx";
import { toast } from "sonner";
import type { Task } from "@/shared/types/task";
import { SheetHandle } from "@/shared/ui/SheetHandle";
import { TaskGradientEllipse } from "@/shared/assets/icons/TaskGradientEllipse";
import { useLockBodyScroll } from "@/shared/hooks/useLockBodyScroll";
import DuplicateTaskForm from "./DuplicateTaskForm";
import styles from "./DuplicateTaskPopup.module.css";
import { useHaptics } from "@/shared/hooks/useHaptics";
import { HAPTIC_NUDGE } from "@/shared/lib/haptics";

interface DuplicateTaskPopupProps {
	task: Task | null;
	isVisible: boolean;
	onClose: () => void;
}

export const DuplicateTaskPopup: React.FC<DuplicateTaskPopupProps> = ({ task, isVisible, onClose }) => {
	const gradientColor = useMemo(() => task?.markerColor || "#3d00cb", [task?.markerColor]);
	const { trigger } = useHaptics();
	const sheetRef = useRef<HTMLElement>(null);

	const handleClose = useCallback(() => {
		trigger(HAPTIC_NUDGE);
		onClose();
	}, [onClose, trigger]);

	const handleSheetPointerDown = useDragToClose(handleClose);

	useEffect(() => {
		if (!isVisible) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") handleClose();
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isVisible, handleClose]);

	useEffect(() => {
		if (isVisible && !task) {
			toast.error("Задача не найдена");
			onClose();
		}
	}, [isVisible, task, onClose]);

	useLockBodyScroll(isVisible);

	useEffect(() => {
		if (!isVisible) return;
		const handleOutsideClick = (e: MouseEvent) => {
			if (sheetRef.current?.contains(e.target as Node)) return;
			e.stopPropagation();
			handleClose();
		};
		// Delay registration so the click that opened the popup doesn't immediately close it
		const timerId = setTimeout(() => {
			document.addEventListener("click", handleOutsideClick, true);
		}, 100);
		return () => {
			clearTimeout(timerId);
			document.removeEventListener("click", handleOutsideClick, true);
		};
	}, [isVisible, handleClose]);

	if (!task) return null;

	return (
		<Popup
			open={isVisible}
			onClose={handleClose}
			modal
			lockScroll
			closeOnDocumentClick={false}
			closeOnEscape={false}
			overlayStyle={{
				background: "var(--popup-overlay-bg)",
				zIndex: 300,
			}}
			contentStyle={{
				position: "fixed",
				bottom: 0,
				left: 0,
				right: 0,
				height: "auto",
				padding: 0,
				border: "none",
				background: "transparent",
				borderRadius: "28px 28px 0 0",
				margin: 0,
			}}
		>
			<section
				ref={sheetRef}
				className={clsx(styles.sheet, styles.sheetEnter)}
				role="dialog"
			>
				<div className={styles.gradientTop} onPointerDown={handleSheetPointerDown}>
					<TaskGradientEllipse className={styles.gradientEllipse} color={gradientColor} uniqueId={task.id || "duplicate-popup"} />
					<SheetHandle />
				</div>
				<div className={styles.header}>
					<h2 className={styles.title}>Дублируем задачу</h2>
				</div>
				<div className={styles.content}>
					<DuplicateTaskForm task={task} onClose={onClose} />
				</div>
			</section>
		</Popup>
	);
};
