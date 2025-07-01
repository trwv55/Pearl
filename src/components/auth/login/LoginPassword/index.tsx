"use client";

import { Button } from "@/components/ui/button";
import { AuthBack } from "@/shared/icons/AuthBack";
import { startBackText } from "@/features/auth/lib/classNames";
import { AuthInput } from "../../shared/AuthInput/Index";
import { memo, useState } from "react";

interface StepEmailProps {
	onChange: (value: string) => void;
	onNext: () => void;
	onPrev: () => void;
}

export const LoginPassword = memo(({ onChange, onNext, onPrev }: StepEmailProps) => {
	const [localPassword, setLocalPassword] = useState("");

	const handleNext = () => {
		onChange(localPassword);
		onNext();
	};

	return (
		<div className="h-full flex flex-col">
			<div className="flex justify-between">
				<Button variant="startBack" onClick={onPrev}>
					<AuthBack className="w-[6px] h-[10px]" />
					Назад
				</Button>
			</div>
			<div className={`${startBackText} mt-[40px]`}>Шаг 2/2</div>
			<AuthInput
				type="password"
				title="Теперь вспомни пароль"
				icon="🔐️"
				placeholder="Пароль"
				value={localPassword}
				onChange={e => setLocalPassword(e.target.value)}
			/>
			<div className="mt-auto">
				<Button variant="start" size="start" onClick={handleNext}>
					Готово
				</Button>
			</div>
		</div>
	);
});

LoginPassword.displayName = "LoginPassword";
