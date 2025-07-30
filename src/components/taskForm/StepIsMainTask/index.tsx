"use client";
import clsx from "clsx";
import styles from "../shared/styles.module.css";
import { MainTasksCount } from "@/widgets/mainPage/shared/tasksCount/MainTasksCount";
import { memo } from "react";
import { observer } from "mobx-react-lite";
import { taskStore } from "@/entities/task/store";

interface Props {
	value: "yes" | "no";
	onChange: (val: "yes" | "no") => void;
}

const StepIsMainTask = observer(({ value, onChange }: Props) => {
	const handleToggle = (val: "yes" | "no") => {
		onChange(val);
	};

	return (
		<div className={styles.wrap}>
			<div className={styles.labelWrap}>
				<div className={styles.label}>
					<span>Шаг 2/6: </span>
					Это главная задача на сегодня?
				</div>

                                <MainTasksCount current={taskStore.mainTasks.length} max={3} />
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
});

export default memo(StepIsMainTask);
