"use client";
import { memo } from "react";
import styles from "./UndoToast.module.css";
import { useWebHaptics } from "web-haptics/react";
import { HAPTIC_LIGHT } from "@/shared/lib/haptics";

interface UndoToastProps {
	title?: string;
	onUndo?: () => void;
	onClose?: () => void;
}

export const UndoToast = memo(function UndoToast({ title = "Задача удалена", onUndo, onClose }: UndoToastProps) {
	const { trigger } = useWebHaptics();

	const handleUndo = () => {
		trigger(...HAPTIC_LIGHT);
		onUndo?.();
	};

	return (
		<div className={styles.wrap} role="alert" aria-live="polite">
			<span className={styles.sheen} aria-hidden />

			<div className={styles.left}>
				<span className={styles.title}>{title}</span>
			</div>

			<div className={styles.divider} aria-hidden />

			<button className={styles.undoBtn} type="button" onClick={handleUndo} aria-label="Отменить">
				<img src="/svg/undo-reverse.svg" alt="Отменить удаление" className={styles.undoIcon} width={18} height={18} />
				Отменить
			</button>
		</div>
	);
});
