"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Popup from "reactjs-popup";
import { useDragToClose } from "@/shared/hooks/useDragToClose";
import clsx from "clsx";
import { UserRoundPen, Bell, RotateCcw, MessageCircleMore, FileText } from "lucide-react";
import { observer } from "mobx-react-lite";
import { SheetHandle } from "@/shared/ui/SheetHandle";
import { SettingItem } from "@/shared/ui/SettingItem";
import { SettingItemToggle } from "@/shared/ui/SettingItemToggle";
import { useLockBodyScroll } from "@/shared/hooks/useLockBodyScroll";
import { userStore } from "@/shared/model/userStore";
import { GiftButton } from "./GiftButton";
import { LogoutButton } from "./LogoutButton";
import { EditNamePopup } from "./EditNamePopup";
import { APP_NAME, APP_VERSION } from "@/shared/lib/version";
import styles from "./SettingsPopup.module.css";
import { useWebHaptics } from "web-haptics/react";
import { HAPTIC_NUDGE, HAPTIC_LIGHT } from "@/shared/lib/haptics";

interface SettingsPopupProps {
	isVisible: boolean;
	onClose: () => void;
}

export const SettingsPopup: React.FC<SettingsPopupProps> = observer(({ isVisible, onClose }) => {
	const [isEditNameOpen, setIsEditNameOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const { trigger } = useWebHaptics();

	useEffect(() => setMounted(true), []);
	const handleSheetPointerDown = useDragToClose(onClose);

	const handleOpenEditName = () => {
		trigger(...HAPTIC_LIGHT);
		setIsEditNameOpen(true);
	};
	const handleCloseEditName = () => setIsEditNameOpen(false);
	const handleCloseBoth = () => {
		setIsEditNameOpen(false);
		onClose();
	};

	useEffect(() => {
		if (!isVisible) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isVisible, onClose]);

	useLockBodyScroll(isVisible);

	const displayName = userStore.displayName;

	if (!mounted) return null;

	// return createPortal(
	// 	<div
	// 		className={clsx(styles.overlay, isVisible && styles.overlayVisible)}
	// 		onClick={(event) => {
	// 			if (event.target === event.currentTarget) {
	// 				trigger(HAPTIC_NUDGE);
	// 				onClose();
	// 			}
	// 		}}
	// 	>
	// 		<section
	// 			className={clsx(styles.sheet, isVisible && styles.sheetVisible, isEditNameOpen && styles.sheetBlurred)}
	// 			role="dialog"
	// 			onPointerDown={handleSheetPointerDown}
	// 		>
	// 			<div className={styles.top}>
	// 				<SheetHandle color="rgba(0, 0, 0, 0.25)" />
	// 			</div>
	// 			<div className={styles.contentWrapper}>
	// 				<div className={styles.header}>
	// 					<h2 className={styles.title}>Настройки</h2>
	// 				</div>
	// 				<div className={styles.content}>
	// 					<div className={styles.settingsContainer}>
	// 						<SettingItem icon={UserRoundPen} label="Изменить имя" value={displayName || ""} onClick={handleOpenEditName} />
	// 						<div className={styles.divider} />
	// 						<SettingItemToggle icon={Bell} label="Уведомления" disabled />
	// 						<div className={styles.divider} />
	// 						<SettingItemToggle icon={RotateCcw} label="Продление задач" disabled />
	// 					</div>
	// 					<GiftButton />
	// 					<div className={styles.settingsContainer}>
	// 						<SettingItem icon={MessageCircleMore} label="Поделиться мнением" value="" onClick={() => trigger(...HAPTIC_LIGHT)} />
	// 					</div>
	// 					<div className={clsx(styles.settingsContainer, styles.settingsContainerLast)}>
	// 						<SettingItem icon={FileText} label="Политика конфиденциальности" value="" onClick={() => trigger(...HAPTIC_LIGHT)} />
	// 					</div>
	// 					<LogoutButton />
	// 					<div className={styles.version}>
	// 						{APP_NAME.charAt(0).toUpperCase() + APP_NAME.slice(1)} {APP_VERSION}
	// 					</div>
	// 				</div>
	// 			</div>
	// 		</section>
	// 		<EditNamePopup isVisible={isEditNameOpen} onClose={handleCloseBoth} onBack={handleCloseEditName} />
	// 	</div>,
	// 	document.body,
	// );

	return (
		<Popup
			open={isVisible}
			onClose={() => { trigger(HAPTIC_NUDGE); onClose(); }}
			modal
			lockScroll
			closeOnDocumentClick={!isEditNameOpen}
			closeOnEscape
			overlayStyle={{
				background: "var(--popup-overlay-bg)",
				display: "flex",
				alignItems: "flex-end",
				justifyContent: "center",
				top: "env(safe-area-inset-top, 0px)",
				zIndex: 300,
			}}
			contentStyle={{
				width: "100%",
				padding: 0,
				border: "none",
				background: "none",
				margin: 0,
			}}
		>
			<>
				<section
					className={clsx(styles.sheet, styles.sheetEnter, isEditNameOpen && styles.sheetBlurred)}
					role="dialog"
					onPointerDown={handleSheetPointerDown}
				>
					<div className={styles.top}>
						<SheetHandle color="rgba(0, 0, 0, 0.25)" />
					</div>
					<div className={styles.contentWrapper}>
						<div className={styles.header}>
							<h2 className={styles.title}>Настройки</h2>
						</div>
						<div className={styles.content}>
							<div className={styles.settingsContainer}>
								<SettingItem icon={UserRoundPen} label="Изменить имя" value={displayName || ""} onClick={handleOpenEditName} />
								<div className={styles.divider} />
								<SettingItemToggle icon={Bell} label="Уведомления" disabled />
								<div className={styles.divider} />
								<SettingItemToggle icon={RotateCcw} label="Продление задач" disabled />
							</div>
							<GiftButton />
							<div className={styles.settingsContainer}>
								<SettingItem icon={MessageCircleMore} label="Поделиться мнением" value="" onClick={() => trigger(...HAPTIC_LIGHT)} />
							</div>
							<div className={clsx(styles.settingsContainer, styles.settingsContainerLast)}>
								<SettingItem icon={FileText} label="Политика конфиденциальности" value="" onClick={() => trigger(...HAPTIC_LIGHT)} />
							</div>
							<LogoutButton />
							<div className={styles.version}>
								{APP_NAME.charAt(0).toUpperCase() + APP_NAME.slice(1)} {APP_VERSION}
							</div>
						</div>
					</div>
				</section>
				<EditNamePopup isVisible={isEditNameOpen} onClose={handleCloseBoth} onBack={handleCloseEditName} />
			</>
		</Popup>
	);
});
