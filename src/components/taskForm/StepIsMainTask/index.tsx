"use client";
import clsx from "clsx";
import styles from "../shared/styles.module.css";
import { MainTasksCount } from "@/widgets/mainPage/shared/tasksCount/MainTasksCount";
import { memo } from "react";

interface Props {
	value: boolean;
	onChange: (val: boolean) => void;
}

function StepIsMainTask({ value, onChange }: Props) {
	const handleToggle = (val: boolean) => {
		onChange(val);
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
						[styles.toggleBtnactive]: value === true,
					})}
					onClick={() => handleToggle(true)}
				>
					Да
				</button>
				<span className={styles.toggleBtnWrapLine} />
				<button
					className={clsx(styles.toggleBtn, {
						[styles.toggleBtnactive]: value === false,
					})}
					onClick={() => handleToggle(false)}
				>
					Нет
				</button>
			</div>
		</div>
	);
}

export default memo(StepIsMainTask);
