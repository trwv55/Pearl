"use client";

import { useState } from "react";
import { addTask } from "@/entities/task/api";
import { userStore } from "@/entities/user/store";
import { taskStore } from "@/entities/task/store";
import { useTaskDateSync } from "@/features/TaskForm/hooks/useTaskDateSync";
import StepCalendar from "@/features/TaskForm/ui/StepCalendar";
import { StepCount } from "@/features/TaskForm/ui/StepCount";
import StepIsMainTask from "@/features/TaskForm/ui/StepIsMainTask";
import StepTitle from "@/features/TaskForm/ui/StepTitle";
import MarkerSelect from "@/features/TaskForm/ui/MarkerSelect";
import { Button } from "@/shared/ui/button";
import Image from "next/image";
import { observer } from "mobx-react-lite";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import StepEmoji from "@/features/TaskForm/ui/StepEmoji";

const DEFAULT_EMOJI = "🐚";

const TaskForm = observer(() => {
	const router = useRouter();
	const [title, setTitle] = useState("");
	const [titleError, setTitleError] = useState(false);
	const [isMain, setIsMain] = useState<boolean>(taskStore.mainTasks.length < 3);
	const [date, setDate] = useState<Date>(taskStore.selectedDate);
	const [comment, setComment] = useState("");
	const [markerColor, setMarkerColor] = useState<string>("#3d00cb");
	const [emoji, setEmoji] = useState("");
	const [time, setTime] = useState<string>("");

	// Используем хук для синхронизации задач при изменении даты
	const { isLoadingTasks } = useTaskDateSync(date, {
		onAutoSwitch: (shouldSwitch) => {
			if (shouldSwitch) {
				setIsMain((currentIsMain) => {
					// Переключаем только если сейчас главная
					return currentIsMain ? false : currentIsMain;
				});
			}
		},
	});

	const handleSubmit = async () => {
		if (!title.trim()) {
			setTitleError(true);
		}

		if (!title.trim() || !date || !markerColor) {
			toast.error("Заполните обязательные поля");
			return;
		}

		if (!userStore.user) {
			toast.error("Нет данных пользователя");
			return;
		}

		const finalEmoji = emoji && emoji.trim() ? emoji : DEFAULT_EMOJI;

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
				emoji: finalEmoji,
				isMain,
				markerColor,
				time: timeInMinutes,
			});
			if (userStore.user) {
				taskStore.setSelectedDate(date); // устанавливаем выбранную дату как активную
				await taskStore.fetchTasks(userStore.user.uid, taskStore.selectedDate); // подгружаем задачи на выбранную дату
			}
			router.back();
		} catch (e) {
			console.error(e);
			toast.error("Не удалось создать задачу");
		}
	};

	return (
		<div className="flex flex-col gap-[40px] w-full pt-[110px]">
			<div className="z-[2]">
				<StepCount stepNumber={1} totalSteps={6} label="Что нужно сделать?" />
				<StepTitle value={title} onChange={setTitle} error={titleError} onErrorClear={() => setTitleError(false)} />
			</div>
			<StepIsMainTask value={isMain} onChange={setIsMain} date={date} isLoading={isLoadingTasks} />
			<StepCalendar value={date} onChange={setDate} onTimeChange={setTime} />
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

export default TaskForm;
