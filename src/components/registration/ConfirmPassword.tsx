"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StepConfirmPasswordProps {
	value: string;
	onChange: (value: string) => void;
	onNext: () => void;
	goBack: () => void;
}

export const StepConfirmPassword = ({ value, onChange, onNext, goBack }: StepConfirmPasswordProps) => {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-between">
				<Button onClick={goBack}>Назад</Button>
				<Button onClick={onNext}>Пропустить</Button>
			</div>
			<div>Шаг 3/5</div>
			<h2 className="text-xl font-bold">Повтори пароль</h2>
			<div>🔐</div>
			<Input type="password" placeholder="Пароль" value={value} onChange={e => onChange(e.target.value)} />
			<Button onClick={onNext}>Далее</Button>
		</div>
	);
};
