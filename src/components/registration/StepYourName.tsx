"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StepYourName {
	value: string;
	onChange: (value: string) => void;
	onNext: () => void;
	goBack: () => void;
}

export const StepYourName = ({ value, onChange, onNext, goBack }: StepYourName) => {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-between">
				<Button onClick={goBack}>Назад</Button>
				<Button onClick={onNext}>Пропустить</Button>
			</div>
			<div>Шаг 4/5</div>
			<h2 className="text-xl font-bold">Как тебя зовут?</h2>
			<div>✍️</div>
			<Input type="text" placeholder="Имя" value={value} onChange={e => onChange(e.target.value)} />
			<Button onClick={onNext}>Продолжить</Button>
		</div>
	);
};
