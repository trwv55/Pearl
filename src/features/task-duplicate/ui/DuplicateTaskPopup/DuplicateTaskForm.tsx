"use client";

import { useState, useEffect } from "react";
import { isSameDay, startOfWeek } from "date-fns";
import { addTask } from "@/shared/api/taskApi";
import type { Task } from "@/shared/types/task";
import { userStore } from "@/shared/model/userStore";
import { taskStore } from "@/shared/model/taskStore";
import { statsStore } from "@/shared/model/statsStore";
import { useDuplicateTaskDateSync } from "@/features/task-duplicate/model/useDuplicateTaskDateSync";
import StepCalendar from "@/shared/ui/task-form-steps/StepCalendar";
import { StepCount } from "@/shared/ui/task-form-steps/StepCount";
import StepIsMainTask from "@/shared/ui/task-form-steps/StepIsMainTask";
import StepTitle from "@/shared/ui/task-form-steps/StepTitle";
import MarkerSelect from "@/shared/ui/task-form-steps/MarkerSelect";
import { Button } from "@/shared/ui/button";
import Image from "next/image";
import { observer } from "mobx-react-lite";
import { showSuccessToast, showErrorToast } from "@/shared/lib/showToast";
import StepEmoji from "@/shared/ui/task-form-steps/StepEmoji";
import { MAX_MAIN_TASKS } from "@/shared/config/tasks";
import { isTaskMain } from "@/shared/types/task";
import { formatTimeFromMinutes } from "@/shared/lib/utils";

interface DuplicateTaskFormProps {
	task: Task;
	onClose: () => void;
}

const DuplicateTaskForm = observer(({ task, onClose }: DuplicateTaskFormProps) => {
	const [title, setTitle] = useState(task.title);
	const [titleError, setTitleError] = useState(false);
	const [date, setDate] = useState(task.date);
	const [comment, setComment] = useState(task.comment || "");
	const [markerColor, setMarkerColor] = useState<string>(task.markerColor || "#3d00cb");
	const [emoji, setEmoji] = useState(task.emoji || "");
	const [time, setTime] = useState<string>("");

	const getInitialIsMain = () => {
		const tasksForDate = taskStore.getTasksForDate(date);
		const mainTasksForDate = tasksForDate.filter(isTaskMain);
		return mainTasksForDate.length >= MAX_MAIN_TASKS ? false : task.isMain;
	};

	const [isMain, setIsMain] = useState(getInitialIsMain);

	useEffect(() => {
		setTime(formatTimeFromMinutes(task.time));
	}, [task.time]);

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

			if (userStore.user) {
				const datesToUpdate = new Set<Date>();
				datesToUpdate.add(taskStore.selectedDate);
				datesToUpdate.add(date);
				if (!isSameDay(date, task.date)) datesToUpdate.add(task.date);

				await Promise.all(Array.from(datesToUpdate).map((d) => taskStore.fetchTasks(userStore.user!.uid, d)));

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
