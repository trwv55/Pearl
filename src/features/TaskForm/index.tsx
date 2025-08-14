"use client";

import { useState, useEffect } from "react";
import { addTask } from "@/entities/task/api";
import { userStore } from "@/entities/user/store";
import { taskStore } from "@/entities/task/store";
import StepCalendar from "@/components/taskForm/StepCalendar";
import { StepCount } from "@/components/taskForm/StepCount";
import StepIsMainTask from "@/components/taskForm/StepIsMainTask";
import StepTitle from "@/components/taskForm/StepTitle";
import MarkerSelect from "@/components/taskForm/MarkerSelect";
import { Button } from "@/shared/ui/button";
import Icon from "../../../public/arrow.svg";
import Image from "next/image";
import { observer } from "mobx-react-lite";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const TaskForm = observer(() => {
	const router = useRouter();
	const [title, setTitle] = useState("");
	const [isMain, setIsMain] = useState<boolean>(taskStore.mainTasks.length < 3);
	const [date, setDate] = useState<Date>(taskStore.selectedDate);
	const [comment, setComment] = useState("");
	const [markerColor, setMarkerColor] = useState<string>("#3d00cb");
	const [emoji, setEmoji] = useState("");

	useEffect(() => {
		if (taskStore.mainTasks.length >= 3) {
			setIsMain(false);
		}
	}, [taskStore.mainTasks.length]);

	const handleSubmit = async () => {
		if (!title.trim() || !date || !markerColor) {
			toast.error("Заполните обязательные поля");
			return;
		}
		if (!userStore.user) {
			toast.error("Нет данных пользователя");
			return;
		}

		try {
			await addTask(userStore.user.uid, {
				title,
				comment,
				date,
				emoji,
				isMain,
				markerColor,
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
				<StepTitle value={title} onChange={setTitle} />
			</div>
			<StepIsMainTask value={isMain} onChange={setIsMain} />
			<StepCalendar value={date} onChange={setDate} />
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
				<StepTitle note="Только один эмодзи" value={emoji} onChange={setEmoji} rows={1} />
			</div>
			<Button variant="mainDashboard" size="start" onClick={handleSubmit}>
				Готово
				<Image src={Icon} alt="icon" width="10" height="10" className="w-5 h-5 shrink-0" />
			</Button>
		</div>
	);
});

export default TaskForm;
