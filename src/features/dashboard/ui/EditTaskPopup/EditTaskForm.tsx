"use client";

import { useState, useEffect } from "react";
import { updateTask } from "@/entities/task/api";
import type { Task } from "@/entities/task/types";
import { userStore } from "@/entities/user/store";
import { taskStore } from "@/entities/task/store";
import StepCalendar from "@/features/TaskForm/ui/StepCalendar";
import { StepCount } from "@/features/TaskForm/ui/StepCount";
import StepIsMainTask from "@/features/TaskForm/ui/StepIsMainTask";
import StepTitle from "@/features/TaskForm/ui/StepTitle";
import MarkerSelect from "@/features/TaskForm/ui/MarkerSelect";
import { Button } from "@/shared/ui/button";
import Image from "next/image";
import { observer } from "mobx-react-lite";
import { toast } from "sonner";
import StepEmoji from "@/features/TaskForm/ui/StepEmoji";

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
	const [time, setTime] = useState<string>(
		task.time !== null
			? `${Math.floor(task.time / 60)
					.toString()
					.padStart(2, "0")}:${(task.time % 60).toString().padStart(2, "0")}`
			: "",
	);

	const handleSubmit = async () => {
		if (!title.trim()) {
			setTitleError(true);
			toast.error("Заполните обязательные поля");
			return;
		}

		if (!userStore.user) {
			toast.error("Нет данных пользователя");
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

			// Обновляем задачи в сторе
			if (userStore.user) {
				await taskStore.fetchTasks(userStore.user.uid, taskStore.selectedDate);
			}

			toast.success("Задача обновлена");
			onClose();
		} catch (e) {
			console.error(e);
			toast.error("Не удалось обновить задачу");
		}
	};

	return (
		<div className="flex flex-col gap-[40px] w-full pt-[110px]">
			<div className="z-[2]">
				<StepCount stepNumber={1} totalSteps={7} label="Что нужно сделать?" />
				<StepTitle value={title} onChange={setTitle} error={titleError} onErrorClear={() => setTitleError(false)} />
			</div>
			<StepIsMainTask value={isMain} onChange={setIsMain} />
			<StepCalendar value={date} onChange={setDate} onTimeChange={setTime} />
			<div>
				<StepCount stepNumber={4} totalSteps={7} label="Нужен комментарий?" />
				<StepTitle note="Если нет, то оставь это поле пустым" value={comment} onChange={setComment} />
			</div>
			<div>
				<StepCount stepNumber={5} totalSteps={7} label="Выбери маркер" />
				<MarkerSelect value={markerColor} onChange={setMarkerColor} />
			</div>
			<div>
				<StepCount stepNumber={6} totalSteps={7} label="Добавь эмодзи" />
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
