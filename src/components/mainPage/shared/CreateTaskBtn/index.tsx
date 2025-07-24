"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./CreateTaskBtn.module.css";

interface CreateTaskBtnProps {
	date?: Date; // дата приходит, но не отправляем
}

export const CreateTaskBtn = ({ date }: CreateTaskBtnProps) => {
	const router = useRouter();

	const handleClick = () => {
		router.push("/create");
		console.log("Текущая дата в кнопке:", date);
	};

	return (
		<button className={styles.btn} onClick={handleClick} aria-label="Создать задачу">
			<Image src="svg/plus-btn.svg" alt="Создать задачу" width={24} height={24} />
		</button>
	);
};
