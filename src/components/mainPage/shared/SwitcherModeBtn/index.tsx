"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./SwitcherModeBtn.module.css";
import { motion } from "framer-motion";

export const SwitcherModeBtn = () => {
	const [mode, setMode] = useState<"list" | "calendar">("list");

	return (
		<div className={styles.wrap}>
			{/* Кнопка списка */}
			<button
				className={`${styles.btn} ${mode === "list" ? styles.active : ""}`}
				onClick={() => setMode("list")}
				aria-label="Режим списка"
			>
				{mode === "list" ? (
					<Image src="svg/list-btn-active.svg" alt="Список активен" width={20} height={20} />
				) : (
					<Image src="svg/list-btn.svg" alt="Список" width={20} height={20} />
				)}
			</button>

			{/* Кнопка календаря */}
			<button
				className={`${styles.btn} ${mode === "calendar" ? styles.active : ""}`}
				onClick={() => setMode("calendar")}
				aria-label="Режим календаря"
			>
				{mode === "calendar" ? (
					<Image src="svg/calendar-btn-active.svg" alt="Календарь активен" width={20} height={20} />
				) : (
					<Image src="svg/calendar-btn.svg" alt="Календарь" width={20} height={20} />
				)}
			</button>
		</div>
	);
};
