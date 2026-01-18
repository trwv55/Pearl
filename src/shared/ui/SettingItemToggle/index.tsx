import React from "react";
import { LucideIcon } from "lucide-react";
import clsx from "clsx";
import styles from "./SettingItemToggle.module.css";

interface SettingItemToggleProps {
	icon: LucideIcon;
	label: string;
	checked?: boolean;
	onChange?: (checked: boolean) => void;
	disabled?: boolean;
}

export const SettingItemToggle: React.FC<SettingItemToggleProps> = ({
	icon: Icon,
	label,
	checked = false,
	onChange,
	disabled = false,
}) => {
	const handleToggleClick = () => {
		if (!disabled && onChange) {
			onChange(!checked);
		}
	};

	return (
		<div className={styles.settingItem}>
			<Icon className={clsx(styles.icon, disabled && styles.iconDisabled)} size={16} />
			<span className={clsx(styles.settingLabel, disabled && styles.settingLabelDisabled)}>{label}</span>
			<div className={styles.toggle} onClick={handleToggleClick}>
				<div className={clsx(styles.toggleKnob, checked && styles.toggleKnobActive)} />
			</div>
		</div>
	);
};

