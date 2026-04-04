import React from "react";
import { Gift } from "lucide-react";
import styles from "./GiftButton.module.css";
import { useWebHaptics } from "web-haptics/react";
import { HAPTIC_LIGHT } from "@/shared/lib/haptics";

interface GiftButtonProps {
	onClick?: () => void;
}

export const GiftButton: React.FC<GiftButtonProps> = ({ onClick }) => {
	const { trigger } = useWebHaptics();

	const handleClick = () => {
		trigger(...HAPTIC_LIGHT);
		onClick?.();
	};

	return (
		<button className={styles.giftButton} onClick={handleClick} type="button">
			<Gift className={styles.giftIcon} size={16} />
			<span className={styles.giftLabel}>Подарить Pearl другу</span>
			<span className={styles.giftArrow}>↗</span>
		</button>
	);
};
