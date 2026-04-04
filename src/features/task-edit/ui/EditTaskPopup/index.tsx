"use client";

import React, { useEffect, useRef, useMemo, useCallback } from "react";
// import { createPortal } from "react-dom";
import Popup from "reactjs-popup";
import { useDragToClose } from "@/shared/hooks/useDragToClose";
import clsx from "clsx";
import { toast } from "sonner";
import type { Task } from "@/shared/types/task";
import { SheetHandle } from "@/shared/ui/SheetHandle";
import { TaskGradientEllipse } from "@/shared/assets/icons/TaskGradientEllipse";
import { useLockBodyScroll } from "@/shared/hooks/useLockBodyScroll";
import EditTaskForm from "./EditTaskForm";
import styles from "./EditTaskPopup.module.css";
import { useWebHaptics } from "web-haptics/react";
import { HAPTIC_NUDGE } from "@/shared/lib/haptics";

interface EditTaskPopupProps {
	task: Task | null;
	isVisible: boolean;
	onClose: () => void;
}

export const EditTaskPopup: React.FC<EditTaskPopupProps> = ({ task, isVisible, onClose }) => {
	const gradientColor = useMemo(() => task?.markerColor || "#3d00cb", [task?.markerColor]);
	const { trigger } = useWebHaptics();
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

		document.addEventListener("click", handleOutsideClick, true);
		return () => document.removeEventListener("click", handleOutsideClick, true);
	}, [isVisible, handleClose]);

	if (!task) return null;

	// return createPortal(
	// 	<div
	// 		className={clsx(styles.overlay, isVisible && styles.overlayVisible)}
	// 		onClick={(event) => {
	// 			if (event.target === event.currentTarget) handleClose();
	// 		}}
	// 	>
	// 		<section className={clsx(styles.sheet, isAnimated && styles.sheetVisible)} role="dialog">
	// 			<div className={styles.gradientTop} onPointerDown={handleSheetPointerDown}>
	// 				<TaskGradientEllipse className={styles.gradientEllipse} color={gradientColor} uniqueId={task.id || "edit-popup"} />
	// 				<SheetHandle />
	// 			</div>
	// 			<div className={styles.header}>
	// 				<h2 className={styles.title}>Редактируем задачу</h2>
	// 			</div>
	// 			<div className={styles.content}>
	// 				<EditTaskForm task={task} onClose={onClose} />
	// 			</div>
	// 		</section>
	// 	</div>,
	// 	document.body,
	// );

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
				background: "var(--app-bg)",
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
					<TaskGradientEllipse className={styles.gradientEllipse} color={gradientColor} uniqueId={task.id || "edit-popup"} />
					<SheetHandle />
				</div>
				<div className={styles.header}>
					<h2 className={styles.title}>Редактируем задачу</h2>
				</div>
				<div className={styles.content}>
					<EditTaskForm task={task} onClose={onClose} />
				</div>
			</section>
		</Popup>
	);
};
