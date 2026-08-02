"use client";

import { useRef, useState } from "react";
import { userStore } from "@/shared/model/userStore";
import { taskStore } from "@/shared/model/taskStore";
import { useTaskDateSync } from "@/shared/hooks/useTaskDateSync";
import StepCalendar from "@/shared/ui/task-form-steps/StepCalendar";
import { StepCount } from "@/shared/ui/task-form-steps/StepCount";
import StepIsMainTask from "@/shared/ui/task-form-steps/StepIsMainTask";
import StepTitle from "@/shared/ui/task-form-steps/StepTitle";
import MarkerSelect from "@/shared/ui/task-form-steps/MarkerSelect";
import { Button } from "@/shared/ui/button";
import Image from "next/image";
import { observer } from "mobx-react-lite";
import { showSuccessToast, showErrorToast } from "@/shared/lib/showToast";
import { useRouter } from "next/navigation";
import StepEmoji from "@/shared/ui/task-form-steps/StepEmoji";
import { useHaptics } from "@/shared/hooks/useHaptics";
import { HAPTIC_ERROR, HAPTIC_SUCCESS } from "@/shared/lib/haptics";
import { MAX_MAIN_TASKS } from "@/shared/config/tasks";

const DEFAULT_EMOJI = "🐚";

const TaskForm = observer(() => {
	const router = useRouter();
	const { trigger } = useHaptics();
	const [title, setTitle] = useState("");
	const [titleError, setTitleError] = useState(false);
	const [isMain, setIsMain] = useState<boolean>(taskStore.mainTasks.length < MAX_MAIN_TASKS);
	const [date, setDate] = useState<Date>(taskStore.selectedDate);
	const [comment, setComment] = useState("");
	const [markerColor, setMarkerColor] = useState<string>("#3d00cb");
	const [emoji, setEmoji] = useState("");
	const [time, setTime] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const submitLockRef = useRef(false);

	const { isLoadingTasks } = useTaskDateSync(date, {
		onAutoSwitch: (shouldSwitch) => {
			if (shouldSwitch) {
				setIsMain((currentIsMain) => (currentIsMain ? false : currentIsMain));
			}
		},
	});

	const handleSubmit = async () => {
		if (submitLockRef.current) return;

		if (!title.trim()) setTitleError(true);

		if (!title.trim() || !date || !markerColor) {
			trigger(HAPTIC_ERROR);
			showErrorToast("Заполните обязательные поля");
			return;
		}

		if (!userStore.user) {
			trigger(HAPTIC_ERROR);
			showErrorToast("Нет данных пользователя");
			return;
		}

		submitLockRef.current = true;
		setIsSubmitting(true);

		const finalEmoji = emoji && emoji.trim() ? emoji : DEFAULT_EMOJI;

		trigger(HAPTIC_SUCCESS);

		const timeInMinutes = time
			? (() => {
					const [h, m] = time.split(":");
					return parseInt(h, 10) * 60 + parseInt(m, 10);
			  })()
			: null;

		// Открываем день новой задачи, затем оптимистично создаём её:
		// задача сразу появляется в UI, запись в Firestore идёт в фоне.
		taskStore.setSelectedDate(date);
		taskStore.createOptimistic(userStore.user.uid, {
			title,
			comment,
			date,
			emoji: finalEmoji,
			isMain,
			markerColor,
			time: timeInMinutes,
		});

		showSuccessToast("Задача создана");
		router.back();
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
			<Button variant="mainDashboard" size="start" onClick={handleSubmit} disabled={isSubmitting}>
				Готово
				<Image src="/arrow.svg" alt="icon" width="10" height="10" className="w-5 h-5 shrink-0" />
			</Button>
		</div>
	);
});

export default TaskForm;
