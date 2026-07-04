"use client";

import React, { useEffect, useRef, useState } from "react";
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
import { useHaptics } from "@/shared/hooks/useHaptics";
import { HAPTIC_NUDGE, HAPTIC_LIGHT } from "@/shared/lib/haptics";
import { notificationSettingsStore } from "@/shared/model/notificationSettingsStore";
import { showErrorToast, showSuccessToast } from "@/shared/lib/showToast";

const ANIMATION_DURATION = 250;

interface SettingsPopupProps {
	isVisible: boolean;
	onClose: () => void;
	onOpen?: () => void;
}

export const SettingsPopup: React.FC<SettingsPopupProps> = observer(({ isVisible, onClose, onOpen }) => {
	const [isEditNameOpen, setIsEditNameOpen] = useState(false);
	const [editNameHeight, setEditNameHeight] = useState<number | null>(null);
	const [mounted, setMounted] = useState(false);
	const { trigger } = useHaptics();
	const sheetRef = useRef<HTMLElement>(null);
	const editNameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => setMounted(true), []);
	useEffect(() => {
		return () => {
			if (editNameTimerRef.current) clearTimeout(editNameTimerRef.current);
		};
	}, []);

	const handleSheetPointerDown = useDragToClose(onClose);

	const handleOpenEditName = () => {
		trigger(...HAPTIC_LIGHT);
		if (sheetRef.current) {
			setEditNameHeight(sheetRef.current.offsetHeight);
		}
		onClose();
		if (editNameTimerRef.current) clearTimeout(editNameTimerRef.current);
		editNameTimerRef.current = setTimeout(() => {
			setIsEditNameOpen(true);
			editNameTimerRef.current = null;
		}, ANIMATION_DURATION);
	};

	const handleCloseEditName = () => {
		setIsEditNameOpen(false);
		if (editNameTimerRef.current) clearTimeout(editNameTimerRef.current);
		editNameTimerRef.current = setTimeout(() => {
			onOpen?.();
			editNameTimerRef.current = null;
		}, ANIMATION_DURATION);
	};

	const handleCloseEditNameFinal = () => {
		setIsEditNameOpen(false);
	};

	const handleNotificationsToggle = async (checked: boolean) => {
		trigger(...HAPTIC_LIGHT);
		if (checked) {
			const enabled = await notificationSettingsStore.enableNotifications();
			if (enabled) {
				showSuccessToast("Уведомления включены");
			} else {
				console.warn("Не удалось включить уведомления");
			}
			return;
		}

		await notificationSettingsStore.disableNotifications();
		showSuccessToast("Уведомления отключены");
	};

	useEffect(() => {
		if (!isVisible) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isVisible, onClose]);

	useEffect(() => {
		if (!isVisible) return;

		const handleOutsideClick = (e: MouseEvent) => {
			const path = e.composedPath ? e.composedPath() : [];
			const targetNode = e.target instanceof Node ? e.target : null;
			if (sheetRef.current && (path.includes(sheetRef.current) || (targetNode && sheetRef.current.contains(targetNode)))) {
				return;
			}
			e.stopPropagation();
			trigger(HAPTIC_NUDGE);
			onClose();
		};

		document.addEventListener("click", handleOutsideClick, true);
		return () => document.removeEventListener("click", handleOutsideClick, true);
	}, [isVisible, onClose, trigger]);

	useLockBodyScroll(isVisible);

	useEffect(() => {
		if (!isVisible) return;
		void notificationSettingsStore.initialize();
	}, [isVisible]);

	const displayName = userStore.displayName;

	if (!mounted) return null;

	return (
		<>
			<Popup
				open={isVisible}
				onClose={() => { trigger(HAPTIC_NUDGE); onClose(); }}
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
					borderRadius: "40px 40px 0 0",
					margin: 0,
				}}
			>
				<section
					ref={sheetRef}
					className={clsx(styles.sheet, styles.sheetEnter)}
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
								<SettingItemToggle
									icon={Bell}
									label="Уведомления"
									checked={notificationSettingsStore.isNotificationsEnabled}
									onChange={handleNotificationsToggle}
								/>
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
			</Popup>
			<EditNamePopup isVisible={isEditNameOpen} onClose={handleCloseEditNameFinal} onBack={handleCloseEditName} height={editNameHeight} />
		</>
	);
});
