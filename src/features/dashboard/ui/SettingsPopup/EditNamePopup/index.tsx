"use client";

import React, { useEffect, useState, useRef } from "react";
import clsx from "clsx";
import { ChevronLeft } from "lucide-react";
import { observer } from "mobx-react-lite";
import { SheetHandle } from "@/shared/ui/SheetHandle";
import { PopupGradientBackground } from "@/shared/assets/icons/PopupGradientBackground";
import { useLockBodyScroll } from "@/shared/hooks/useLockBodyScroll";
import { userStore } from "@/entities/user/store";
import { updateUserName } from "@/shared/lib/auth/updateUserName";
import { getFirebaseAuth } from "@/shared/lib/firebase";
import styles from "./EditNamePopup.module.css";

interface EditNamePopupProps {
	isVisible: boolean;
	onClose: () => void;
	onBack?: () => void;
}

export const EditNamePopup: React.FC<EditNamePopupProps> = observer(({ isVisible, onClose, onBack }) => {
	const [name, setName] = useState("");
	const [popupHeight, setPopupHeight] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const sheetRef = useRef<HTMLElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Получаем высоту попапа настроек и применяем к попапу изменения имени
	useEffect(() => {
		if (isVisible) {
			// Находим попап настроек
			const settingsPopup = document.querySelector('[role="dialog"]') as HTMLElement;
			if (settingsPopup) {
				const height = settingsPopup.offsetHeight;
				setPopupHeight(height);
			}
			// Инициализация имени при открытии
			setName(userStore.displayName || "");
			// Фокус на инпут
			setTimeout(() => {
				inputRef.current?.focus();
			}, 100);
		}
	}, [isVisible]);

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

	// Блокировка скролла страницы при открытии попапа
	useLockBodyScroll(isVisible);

	const handleSave = async () => {
		const trimmedName = name.trim();

		if (!trimmedName) {
			setError("Имя не может быть пустым");
			return;
		}

		if (trimmedName === userStore.displayName) {
			onClose();
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			await updateUserName(trimmedName);
			// Обновляем userStore с обновленным пользователем
			const auth = getFirebaseAuth();
			const updatedUser = auth.currentUser;
			if (updatedUser) {
				userStore.updateUser(updatedUser);
				// Принудительно обновляем для немедленного отображения
				userStore.forceUpdate();
			}
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Не удалось сохранить имя");
		} finally {
			setIsLoading(false);
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter" && !isLoading) {
			handleSave();
		}
	};

	if (!isVisible) {
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
			<section
				ref={sheetRef}
				className={clsx(styles.sheet, isVisible && styles.sheetVisible)}
				role="dialog"
				style={popupHeight ? { height: `${popupHeight}px` } : undefined}
			>
				<div className={styles.gradientTop}>
					<PopupGradientBackground className={styles.gradientBackground} />
				</div>
				<div className={styles.top}>
					<SheetHandle onDragEnd={onClose} />
				</div>
				<div className={styles.header}>
					<button className={styles.backButton} onClick={onBack || onClose} type="button">
						<ChevronLeft className={styles.backIcon} size={20} />
						<span className={styles.backText}>Назад</span>
					</button>
				</div>
				<div className={styles.content}>
					<input
						ref={inputRef}
						type="text"
						className={styles.nameInput}
						value={name}
						onChange={(e) => {
							setName(e.target.value);
							setError(null);
						}}
						onKeyDown={handleKeyDown}
						placeholder="Введите имя"
						maxLength={50}
						disabled={isLoading}
					/>
					{error && <div className={styles.error}>{error}</div>}
					<button className={styles.saveButton} type="button" onClick={handleSave} disabled={isLoading || !name.trim()}>
						{isLoading ? "Сохранение..." : "Сохранить"}
					</button>
				</div>
			</section>
		</div>
	);
});
