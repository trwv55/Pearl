"use client";

import { Button } from "@/components/ui/button";
import { AuthBack } from "@/shared/assets/icons/AuthBack";
import { startBackText } from "@/features/auth/lib/classNames";
import { AuthInput } from "../../shared/AuthInput/Index";
import { memo, useCallback, useState } from "react";

interface Props {
	onChange: (value: string) => void;
	onNext: () => void;
	onPrev: () => void;
	password: string;
}

export const RegisterConfirmPassword = memo(({ onChange, onNext, onPrev, password }: Props) => {
	const [localPassword, setLocalPassword] = useState("");
	const [error, setError] = useState(false);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setLocalPassword(e.target.value);
			if (error) setError(false);
		},
		[error],
	);

	const handleNext = () => {
		if (localPassword !== password) {
			setError(true);
			return;
		}
		setError(false);
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
			<div className={`${startBackText} mt-[40px]`}>Шаг 3/5</div>
			<AuthInput
				type="password"
				title="Повтори пароль"
				icon="🔐️"
				placeholder="Пароль"
				value={localPassword}
				onChange={handleInputChange}
				error={error}
				errorTitle="Пароли не совпадают"
			/>
			<div className="mt-auto">
				<Button variant="start" size="start" onClick={handleNext}>
					Далее
				</Button>
			</div>
		</div>
	);
});

RegisterConfirmPassword.displayName = "RegisterConfirmPassword";
