"use client";

import { useState, useEffect } from "react";
import { isSameDay } from "date-fns";
import { updateTask } from "@/shared/api/taskApi";
import type { Task } from "@/shared/types/task";
import { userStore } from "@/shared/model/userStore";
import { taskStore } from "@/shared/model/taskStore";
import { useTaskDateSync } from "@/features/task-edit/model/useTaskDateSync";
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
import { formatTimeFromMinutes } from "@/shared/lib/utils";

interface EditTaskFormProps {
	task: Task;
	onClose: () => void;
}

const EditTaskForm = observer(({ task, onClose }: EditTaskFormProps) => {
	const [title, setTitle] = useState(task.title);
	const [titleError, setTitleError] = useState(false);
	const [isMain, setIsMain] = useState(task.isMain);
	const [date, setDate] = useState(task.date);
	const [comment, setComment] = useState(task.comment || "");
	const [markerColor, setMarkerColor] = useState<string>(task.markerColor || "#3d00cb");
	const [emoji, setEmoji] = useState(task.emoji || "");
	const [time, setTime] = useState<string>("");

	useEffect(() => {
		setTime(formatTimeFromMinutes(task.time));
	}, [task.time]);

	const { isLoadingTasks } = useTaskDateSync(date, {
		originalDate: task.date,
		onAutoSwitch: (shouldSwitch) => {
			if (shouldSwitch) {
				setIsMain((currentIsMain) => (currentIsMain ? false : currentIsMain));
			}
		},
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

			await updateTask(userStore.user.uid, task.id, {
				title,
				comment,
				date,
				emoji: emoji || "🐚",
				isMain,
				markerColor,
				time: timeInMinutes,
			});

			if (userStore.user) {
				const dateChanged = !isSameDay(date, task.date);
				const datesToUpdate = new Set<Date>();
				datesToUpdate.add(taskStore.selectedDate);
				datesToUpdate.add(date);
				if (dateChanged) datesToUpdate.add(task.date);

				await Promise.all(Array.from(datesToUpdate).map((d) => taskStore.fetchTasks(userStore.user!.uid, d)));
			}

			showSuccessToast("Задача обновлена");
			onClose();
		} catch (e) {
			console.error(e);
			showErrorToast("Не удалось обновить задачу");
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
				originalIsMain={task.isMain}
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

EditTaskForm.displayName = "EditTaskForm";

export default EditTaskForm;
