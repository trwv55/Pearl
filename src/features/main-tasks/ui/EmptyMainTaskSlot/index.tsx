"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { ROUTES } from "@/shared/lib/routes";
import { useHaptics } from "@/shared/hooks/useHaptics";
import { HAPTIC_LIGHT } from "@/shared/lib/haptics";
import styles from "./EmptyMainTaskSlot.module.css";

// Плейсхолдер пустого слота главной задачи. По тапу — переход к созданию:
// форма по умолчанию ставит isMain и текущую выбранную дату.
export const EmptyMainTaskSlot = () => {
	const router = useRouter();
	const { trigger } = useHaptics();

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		trigger(...HAPTIC_LIGHT);
		router.push(ROUTES.CREATE);
	};

	return (
		<button type="button" className={styles.slot} onClick={handleClick} aria-label="Создать главную задачу">
			<span className={styles.title}>
				<span className={styles.bold}>Будущая</span> задача
			</span>
			<Plus className={styles.icon} size={12} strokeWidth={2} aria-hidden />
		</button>
	);
};
