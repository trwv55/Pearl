"use client";

import clsx from "clsx";
import { observer } from "mobx-react-lite";
import { taskStore } from "@/entities/task/store";
import styles from "../shared/styles.module.css";
import { MainTasksCount } from "@/widgets/mainPage/shared/tasksCount/MainTasksCount";

interface Props {
	value: boolean;
	onChange: (val: boolean) => void;
}

const MAX_MAIN_TASKS = 3;

function StepIsMainTask({ value, onChange }: Props) {
	const currentCount = taskStore.mainTasks.length;

	console.log("currentCount", currentCount);

	const handleToggle = (val: boolean) => {
		if (val && currentCount >= MAX_MAIN_TASKS) return;
		onChange(val);
	};

	return (
		<div className={styles.wrap}>
			<div className={styles.labelWrap}>
				<div className={styles.label}>
					<span>Шаг 2/6: </span>
					Это главная задача на сегодня?
				</div>

				<MainTasksCount current={currentCount} max={MAX_MAIN_TASKS} />
			</div>

			<div className={styles.toggleBtnWrap}>
				<button
					className={clsx(styles.toggleBtn, {
						[styles.toggleBtnactive]: value === true,
					})}
					onClick={() => handleToggle(true)}
					disabled={currentCount >= MAX_MAIN_TASKS}
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

export default observer(StepIsMainTask);
