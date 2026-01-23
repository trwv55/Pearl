"use client";

import { useState, useEffect } from "react";
import { isSameDay } from "date-fns";
import { addTask } from "@/entities/task/api";
import type { Task } from "@/entities/task/types";
import { userStore } from "@/entities/user/store";
import { taskStore } from "@/entities/task/store";
import { statsStore } from "@/entities/stats/store";
import { useDuplicateTaskDateSync } from "@/features/dashboard/hooks/useDuplicateTaskDateSync";
import { startOfWeek } from "date-fns";
import StepCalendar from "@/features/TaskForm/ui/StepCalendar";
import { StepCount } from "@/features/TaskForm/ui/StepCount";
import StepIsMainTask from "@/features/TaskForm/ui/StepIsMainTask";
import StepTitle from "@/features/TaskForm/ui/StepTitle";
import MarkerSelect from "@/features/TaskForm/ui/MarkerSelect";
import { Button } from "@/shared/ui/button";
import Image from "next/image";
import { observer } from "mobx-react-lite";
import { showSuccessToast, showErrorToast } from "@/shared/lib/showToast";
import StepEmoji from "@/features/TaskForm/ui/StepEmoji";
import { MAX_MAIN_TASKS } from "@/features/dashboard/constants";
import { isTaskMain } from "@/entities/task/types";
import { formatTimeFromMinutes } from "@/shared/lib/utils";

interface DuplicateTaskFormProps {
	task: Task;
	onClose: () => void;
}

const DuplicateTaskForm = observer(({ task, onClose }: DuplicateTaskFormProps) => {
	const [title, setTitle] = useState(task.title);
	const [titleError, setTitleError] = useState(false);
	const originalDate = task.date;
	const [date, setDate] = useState(task.date);
	const [comment, setComment] = useState(task.comment || "");
	const [markerColor, setMarkerColor] = useState<string>(task.markerColor || "#3d00cb");
	const [emoji, setEmoji] = useState(task.emoji || "");
	const [time, setTime] = useState<string>("");

	// Изначально проверяем лимит главных задач на текущей дате
	// Если 3/3 - всегда ставим задачу как не главную
	const getInitialIsMain = () => {
		const tasksForDate = taskStore.getTasksForDate(date);
		const mainTasksForDate = tasksForDate.filter(isTaskMain);
		// Всегда когда 3/3 - ставим задачу как не главную
		return mainTasksForDate.length >= MAX_MAIN_TASKS ? false : task.isMain;
	};

	const [isMain, setIsMain] = useState(getInitialIsMain);

	// Инициализируем время из задачи при монтировании компонента
	useEffect(() => {
		setTime(formatTimeFromMinutes(task.time));
	}, [task.time]);

	// Используем специальный хук для синхронизации задач при изменении даты при дублировании
	const { isLoadingTasks } = useDuplicateTaskDateSync(date, {
		originalDate: task.date,
		originalIsMain: task.isMain,
		onIsMainChange: setIsMain,
	});

	const handleSubmit = async () => {
		if (!title.trim()) {
			setTitleError(true);
			showErrorToast("Заполните обязательные поля");
			return;
		}

		if (!userStore.user) {
			showErrorToast("Нет данных пользователя");
			return;
		}

		try {
			const timeInMinutes = time
				? (() => {
						const [h, m] = time.split(":");
						return parseInt(h, 10) * 60 + parseInt(m, 10);
				  })()
				: null;

			await addTask(userStore.user.uid, {
				title,
				comment,
				date,
				emoji: emoji || "🐚",
				isMain,
				markerColor,
				time: timeInMinutes,
			});

			// Обновляем задачи в сторе для выбранной даты и даты новой задачи
			if (userStore.user) {
				const datesToUpdate = new Set<Date>();
				datesToUpdate.add(taskStore.selectedDate);
				datesToUpdate.add(date);

				// Если дата изменилась, обновляем также исходную дату
				if (!isSameDay(date, task.date)) {
					datesToUpdate.add(task.date);
				}

				// Загружаем задачи для всех затронутых дат параллельно
				await Promise.all(Array.from(datesToUpdate).map((d) => taskStore.fetchTasks(userStore.user!.uid, d)));

				// Обновляем статистику, если задача главная
				if (isMain) {
					const weekStart = startOfWeek(date, { weekStartsOn: 1 });
					statsStore.fetchWeekStats(userStore.user.uid, weekStart);
				}
			}

			showSuccessToast("Задача создана");
			onClose();
		} catch (e) {
			console.error(e);
			showErrorToast("Ошибка. Попробуй еще раз");
		}
	};

	return (
		<div className="flex flex-col gap-[40px] w-full pt-[110px]">
			<div className="z-[2]">
				<StepCount stepNumber={1} totalSteps={6} label="Что нужно сделать?" />
				<StepTitle value={title} onChange={setTitle} error={titleError} onErrorClear={() => setTitleError(false)} />
			</div>
			<StepIsMainTask
				value={isMain}
				onChange={setIsMain}
				originalIsMain={undefined}
				date={date}
				originalDate={task.date}
				isLoading={isLoadingTasks}
			/>
			<StepCalendar value={date} onChange={setDate} onTimeChange={setTime} time={time} />
			<div>
				<StepCount stepNumber={4} totalSteps={6} label="Нужен комментарий?" />
				<StepTitle note="Если нет, то оставь это поле пустым" value={comment} onChange={setComment} />
			</div>
			<div>
				<StepCount stepNumber={5} totalSteps={6} label="Выбери маркер" />
				<MarkerSelect value={markerColor} onChange={setMarkerColor} />
			</div>
			<div>
				<StepCount stepNumber={6} totalSteps={6} label="Добавь эмодзи" />
				<StepEmoji value={emoji} onChange={setEmoji} rows={1} />
			</div>
			<Button variant="mainDashboard" size="start" onClick={handleSubmit}>
				Готово
				<Image src="/arrow.svg" alt="icon" width="10" height="10" className="w-5 h-5 shrink-0" />
			</Button>
		</div>
	);
});

DuplicateTaskForm.displayName = "DuplicateTaskForm";

export default DuplicateTaskForm;
