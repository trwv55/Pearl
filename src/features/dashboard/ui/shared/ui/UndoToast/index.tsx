"use client";
import { memo } from "react";
import styles from "./UndoToast.module.css";

interface UndoToastProps {
	title?: string; // "Задача удалена"
	onUndo?: () => void;
	onClose?: () => void;
}

export const UndoToast = memo(function UndoToast({ title = "Задача удалена", onUndo, onClose }: UndoToastProps) {
	return (
		<div className={styles.wrap} role="alert" aria-live="polite">
			{/* декоративный бликовый градиент */}
			<span className={styles.sheen} aria-hidden />

			<div className={styles.left}>
				<span className={styles.title}>{title}</span>
			</div>

			<div className={styles.divider} aria-hidden />

			<button className={styles.undoBtn} type="button" onClick={onUndo} aria-label="Отменить">
				<img src="/svg/undo-reverse.svg" alt="Отменить удаление" className={styles.undoIcon} width={18} height={18} />
				Отменить
			</button>
		</div>
	);
});
