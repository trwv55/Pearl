"use client";

import { Button } from "@/shared/ui/button";
import { AuthBack } from "@/shared/assets/icons/AuthBack";
import { useRouter } from "next/navigation";
import { startBackText } from "@/features/auth/lib/classNames";
import { AuthInput } from "../../shared/AuthInput/Index";
import { memo, useCallback, useState } from "react";
import { emailSchema } from "../../../lib/yupShemas";
import { ROUTES } from "@/shared/lib/routes";

interface StepEmailProps {
	value: string;
	onChange: (value: string) => void;
	onNext: () => void;
}

export const LoginEmail = memo(({ value, onChange, onNext }: StepEmailProps) => {
	const router = useRouter();
	const [error, setError] = useState(false);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = e.target.value;
			onChange(newValue);
			if (error) setError(false);
		},
		[error, onChange],
	);

	const handleNext = useCallback(async () => {
		try {
			await emailSchema.validate({ email: value });
			setError(false);
			onNext();
		} catch {
			setError(true);
		}
	}, [value, onNext]);

	const handleBack = useCallback(() => {
		if (typeof window !== "undefined" && window.history.length > 1) {
			router.back();
		} else {
			router.push(ROUTES.HOME);
		}
	}, [router]);

	return (
		<div className="h-full flex flex-col">
			<div className="flex justify-between">
				<Button variant="startBack" onClick={handleBack}>
					<AuthBack className="w-[6px] h-[10px]" />
					Назад
				</Button>
			</div>
			<div className={`${startBackText} mt-[40px]`}>Шаг 1/2</div>
			<AuthInput
				title="Введи свой email"
				icon="✉️"
				placeholder="Email"
				value={value}
				onChange={handleInputChange}
				onEnterKey={handleNext}
				errorTitle="Неверный email"
				error={error}
			/>
			<div className="mt-auto">
				<Button variant="start" size="start" onClick={handleNext}>
					Далее
				</Button>
			</div>
		</div>
	);
});

LoginEmail.displayName = "LoginEmail";
