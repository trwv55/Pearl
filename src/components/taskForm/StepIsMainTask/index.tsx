"use client";
import { useState } from "react";
import styles from "../shared/styles.module.css";
import clsx from "clsx";
import { MainTasksCount } from "@/components/shared/tasksCount/MainTasksCount";

export default function StepIsMainTask() {
	const [value, setValue] = useState<"yes" | "no" | null>(null);

	const handleToggle = (val: "yes" | "no") => {
		setValue(val);
	};

	return (
		<div className={styles.wrap}>
			<div className={styles.labelWrap}>
				<div className={styles.label}>
					<span>Шаг 2/6: </span>
					Это главная задача на сегодня?
				</div>

				<MainTasksCount current={0} max={3} />
			</div>

			<div className={styles.toggleBtnWrap}>
				<button
					className={clsx(styles.toggleBtn, {
						[styles.toggleBtnactive]: value === "yes",
					})}
					onClick={() => handleToggle("yes")}
				>
					Да
				</button>
				<span className={styles.toggleBtnWrapLine} />
				<button
					className={clsx(styles.toggleBtn, {
						[styles.toggleBtnactive]: value === "no",
					})}
					onClick={() => handleToggle("no")}
				>
					Нет
				</button>
			</div>
		</div>
	);
}
