"use client";

import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { UserRoundPen, Bell, RotateCcw, MessageCircleMore, FileText } from "lucide-react";
import { observer } from "mobx-react-lite";
import { SheetHandle } from "@/shared/ui/SheetHandle";
import { SettingItem } from "@/shared/ui/SettingItem";
import { SettingItemToggle } from "@/shared/ui/SettingItemToggle";
import { useLockBodyScroll } from "@/shared/hooks/useLockBodyScroll";
import { userStore } from "@/entities/user/store";
import { GiftButton } from "./GiftButton";
import { LogoutButton } from "./LogoutButton";
import { EditNamePopup } from "./EditNamePopup";
import styles from "./SettingsPopup.module.css";

interface SettingsPopupProps {
	isVisible: boolean;
	onClose: () => void;
}

export const SettingsPopup: React.FC<SettingsPopupProps> = observer(({ isVisible, onClose }) => {
	const [isEditNameOpen, setIsEditNameOpen] = useState(false);

	const handleOpenEditName = () => {
		setIsEditNameOpen(true);
	};

	const handleCloseEditName = () => {
		setIsEditNameOpen(false);
	};

	const handleCloseBoth = () => {
		setIsEditNameOpen(false);
		onClose(); // Закрываем и попап настроек
	};

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

	const displayName = userStore.displayName;

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
				<div className={styles.top}>
					<SheetHandle onDragEnd={onClose} />
				</div>
				<div className={clsx(styles.contentWrapper, isEditNameOpen && styles.contentWrapperBlurred)}>
					<div className={styles.header}>
						<h2 className={styles.title}>Настройки</h2>
					</div>
					<div className={styles.content}>
						<div className={styles.settingsContainer}>
							<SettingItem
								icon={UserRoundPen}
								label="Изменить имя"
								value={displayName || ""}
								onClick={handleOpenEditName}
							/>
							<div className={styles.divider} />
							<SettingItemToggle icon={Bell} label="Уведомления" disabled />
							<div className={styles.divider} />
							<SettingItemToggle icon={RotateCcw} label="Продление задач" disabled />
						</div>
						<GiftButton />
						<div className={styles.settingsContainer}>
							<SettingItem icon={MessageCircleMore} label="Поделиться мнением" value="" />
						</div>
						<div className={clsx(styles.settingsContainer, styles.settingsContainerLast)}>
							<SettingItem icon={FileText} label="Политика конфиденциальности" value="" />
						</div>
						<LogoutButton />
					</div>
				</div>
			</section>
			<EditNamePopup isVisible={isEditNameOpen} onClose={handleCloseBoth} onBack={handleCloseEditName} />
		</div>
	);
});
