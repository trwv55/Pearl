"use client";

import clsx from "clsx";
import { observer } from "mobx-react-lite";
import { isSameDay } from "date-fns";
import { taskStore } from "@/entities/task/store";
import { isTaskMain, type Task } from "@/entities/task/types";
import { MAX_MAIN_TASKS } from "@/features/dashboard/constants";
import styles from "../shared/styles.module.css";
import { MainTasksCount } from "@/widgets/mainPage/shared/tasksCount/MainTasksCount";

interface Props {
	value: boolean;
	onChange: (val: boolean) => void;
	originalIsMain?: boolean; // Исходное значение isMain при редактировании
	date?: Date; // Дата для которой нужно показать количество главных задач
	originalDate?: Date; // Исходная дата задачи при редактировании
	isLoading?: boolean; // Состояние загрузки задач
}

function StepIsMainTask({ value, onChange, originalIsMain, date, originalDate, isLoading }: Props) {
	// Если передана дата, используем задачи для этой даты, иначе используем задачи из стора
	const tasksForDate: Task[] = date ? taskStore.getTasksForDate(date) : taskStore.tasks;
	const mainTasksForDate = tasksForDate.filter(isTaskMain);
	const currentCount = mainTasksForDate.length;

	// Проверяем, изменилась ли дата относительно исходной
	const isDateChanged = date && originalDate ? !isSameDay(date, originalDate) : false;

	const handleToggle = (val: boolean) => {
		// Если переключаем на главную (true)
		if (val) {
			// Если дата изменилась и на новой дате уже максимум главных задач - блокируем
			if (isDateChanged && currentCount >= MAX_MAIN_TASKS) return;

			// Если редактируем задачу, которая была рутиной, проверяем лимит
			if (originalIsMain !== undefined && !originalIsMain) {
				if (currentCount >= MAX_MAIN_TASKS) return;
			} else if (originalIsMain === undefined) {
				// Создание новой задачи
				if (currentCount >= MAX_MAIN_TASKS) return;
			}
			// Если редактируем задачу, которая уже была главной, разрешаем (оставляем главной)
		}
		// Если переключаем на рутину (false) - всегда разрешаем
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
						// Если дата изменилась и на новой дате уже максимум главных задач - блокируем
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
