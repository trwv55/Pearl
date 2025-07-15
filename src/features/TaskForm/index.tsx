"use client";

import StepCalendar from "@/components/taskForm/StepCalendar";
import { StepCount } from "@/components/taskForm/StepCount";
import StepIsMainTask from "@/components/taskForm/StepIsMainTask";
import StepTitle from "@/components/taskForm/StepTitle";
import { Button } from "@/components/ui/button";
import Icon from "../../../public/arrow.svg";
import Image from "next/image";

export default function TaskForm() {
	return (
		<div className="flex flex-col gap-[40px] w-full pt-[110px]">
			<div className="z-[2]">
				<StepCount stepNumber={1} totalSteps={6} label="Что нужно сделать?" />
				<StepTitle />
			</div>
			<StepIsMainTask />
			<StepCalendar />
			<div>
				<StepCount stepNumber={4} totalSteps={6} label="Нужен комментарий?" />
				<StepTitle note="Если нет, то оставь это поле пустым" />
			</div>
			{/* Добавить шаг 5/6: Выбери маркер */}
			<div>
				<StepCount stepNumber={6} totalSteps={6} label="Добавь эмодзи" />
				<StepTitle note="Только один эмодзи" />
			</div>
			<Button variant="mainDashboard" size="start" onClick={() => console.log("click")}>
				Готово
				<Image src={Icon} alt="icon" width="10" height="10" className="w-5 h-5 shrink-0" />
			</Button>
		</div>
	);
}
