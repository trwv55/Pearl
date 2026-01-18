import React from "react";
import { Gift } from "lucide-react";
import styles from "./GiftButton.module.css";

interface GiftButtonProps {
	onClick?: () => void;
}

export const GiftButton: React.FC<GiftButtonProps> = ({ onClick }) => {
	return (
		<button className={styles.giftButton} onClick={onClick} type="button">
			<Gift className={styles.giftIcon} size={16} />
			<span className={styles.giftLabel}>Подарить Pearl другу</span>
			<span className={styles.giftArrow}>↗</span>
		</button>
	);
};

