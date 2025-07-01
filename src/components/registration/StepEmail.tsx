"use client";

import { Button } from "@/components/ui/button";

interface StepEmailProps {
	value: string;
	onChange: (value: string) => void;
	onNext: () => void;
	goBack: () => void;
}

export const StepEmail = ({ value, onChange, onNext, goBack }: StepEmailProps) => {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-between">
				<Button onClick={goBack}>Назад</Button>
				<Button onClick={onNext}>Пропустить</Button>
			</div>
			<div>Шаг 1/5</div>
			<h1 className="text-xl font-bold">Укажи свой email</h1>
			<Input type="email" placeholder="email@example.com" value={value} onChange={e => onChange(e.target.value)} />
			<Button onClick={onNext}>Вперед</Button>
		</div>
	);
};
