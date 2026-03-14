"use client";

import clsx from "clsx";
import { observer } from "mobx-react-lite";
import { isSameDay } from "date-fns";
import { taskStore } from "@/shared/model/taskStore";
import { isTaskMain, type Task } from "@/shared/types/task";
import { MAX_MAIN_TASKS } from "@/shared/config/tasks";
import styles from "../shared/styles.module.css";
import { MainTasksCount } from "@/shared/ui/TasksCount";
import { useWebHaptics } from "web-haptics/react";
import { HAPTIC_LIGHT } from "@/shared/lib/haptics";

interface Props {
	value: boolean;
	onChange: (val: boolean) => void;
	originalIsMain?: boolean;
	date?: Date;
	originalDate?: Date;
	isLoading?: boolean;
}

function StepIsMainTask({ value, onChange, originalIsMain, date, originalDate, isLoading }: Props) {
	const tasksForDate: Task[] = date ? taskStore.getTasksForDate(date) : taskStore.tasks;
	const mainTasksForDate = tasksForDate.filter(isTaskMain);
	const currentCount = mainTasksForDate.length;
	const { trigger } = useWebHaptics();

	const isDateChanged = date && originalDate ? !isSameDay(date, originalDate) : false;

	const handleToggle = (val: boolean) => {
		if (val) {
			if (isDateChanged && currentCount >= MAX_MAIN_TASKS) return;
			if (originalIsMain !== undefined && !originalIsMain) {
				if (currentCount >= MAX_MAIN_TASKS) return;
			} else if (originalIsMain === undefined) {
				if (currentCount >= MAX_MAIN_TASKS) return;
			}
		}
		trigger(...HAPTIC_LIGHT);
		onChange(val);
	};

	return (
		<div className={clsx(styles.wrap, { [styles.loading]: isLoading })}>
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
					disabled={
						isDateChanged && currentCount >= MAX_MAIN_TASKS
							? true
							: originalIsMain === undefined
							? currentCount >= MAX_MAIN_TASKS
							: !originalIsMain && currentCount >= MAX_MAIN_TASKS
					}
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
