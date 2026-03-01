"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./CreateTaskBtn.module.css";
import { ROUTES } from "@/shared/lib/routes";

interface CreateTaskBtnProps {
	date?: Date;
}

export const CreateTaskBtn = ({ date }: CreateTaskBtnProps) => {
	const router = useRouter();

	return (
		<button className={styles.btn} onClick={() => router.push(ROUTES.CREATE)} aria-label="Создать задачу">
			<Image src="svg/plus-btn.svg" alt="Создать задачу" width={24} height={24} />
		</button>
	);
};
