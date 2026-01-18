import React from "react";
import { LucideIcon } from "lucide-react";
import clsx from "clsx";
import styles from "./SettingItem.module.css";

interface SettingItemProps {
	icon: LucideIcon;
	label: string;
	value: string;
	onClick?: () => void;
}

export const SettingItem: React.FC<SettingItemProps> = ({ icon: Icon, label, value, onClick }) => {
	return (
		<div className={styles.settingItem} onClick={onClick}>
			<Icon className={clsx(styles.icon, styles.iconTop)} size={16} />
			<span className={styles.settingLabel}>{label}</span>
			<span className={styles.settingValue}>{value}</span>
		</div>
	);
};

