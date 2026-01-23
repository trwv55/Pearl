"use client";
import { memo } from "react";
import styles from "./ToastMessage.module.css";

interface ToastMessageProps {
	title: string;
	type?: "success" | "error";
	onClose?: () => void;
}

export const ToastMessage = memo(function ToastMessage({ title, type = "success", onClose }: ToastMessageProps) {
	return (
		<div
			className={`${styles.wrap} ${type === "error" ? styles.error : ""}`}
			role="alert"
			aria-live="polite"
			onClick={onClose}
		>
			<p className={styles.title}>{title}</p>
		</div>
	);
});
