"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./CreateTaskBtn.module.css";
import { ROUTES } from "@/shared/lib/routes";
import { useWebHaptics } from "web-haptics/react";
import { HAPTIC_LIGHT } from "@/shared/lib/haptics";

interface CreateTaskBtnProps {
	date?: Date;
}

export const CreateTaskBtn = ({ date }: CreateTaskBtnProps) => {
	const router = useRouter();
	const { trigger } = useWebHaptics();

	const handleClick = () => {
		trigger(...HAPTIC_LIGHT);
		router.push(ROUTES.CREATE);
	};

	return (
		<button className={styles.btn} onClick={handleClick} aria-label="Создать задачу">
			<Image src="svg/plus-btn.svg" alt="Создать задачу" width={24} height={24} />
		</button>
	);
};
