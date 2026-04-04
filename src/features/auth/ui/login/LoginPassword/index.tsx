"use client";

import { Button } from "@/shared/ui/button";
import { AuthBack } from "@/shared/assets/icons/AuthBack";
import { startBackText } from "@/features/auth/lib/classNames";
import { AuthInput } from "../../shared/AuthInput/Index";
import { memo, useCallback, useState } from "react";
import { passwordSchema } from "../../../lib/yupShemas";
import { useRouter } from "next/navigation";
import { useWebHaptics } from "web-haptics/react";
import { HAPTIC_LIGHT, HAPTIC_ERROR } from "@/shared/lib/haptics";

interface StepPasswordProps {
	value: string;
	onChange: (value: string) => void;
	onFinish: () => void;
	onPrev: () => void;
}

export const LoginPassword = memo(({ value, onChange, onFinish, onPrev }: StepPasswordProps) => {
	const router = useRouter();
	const [error, setError] = useState(false);
	const { trigger } = useWebHaptics();

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = e.target.value;
			onChange(newValue);
			if (error) setError(false);
		},
		[error, onChange],
	);

	const handleFinish = useCallback(async () => {
		try {
			await passwordSchema.validate({ password: value });
			setError(false);
			trigger(...HAPTIC_LIGHT);
			onFinish();
		} catch {
			trigger(HAPTIC_ERROR);
			setError(true);
		}
	}, [value, onFinish, trigger]);

	const handleBack = useCallback(() => {
		trigger(...HAPTIC_LIGHT);
		router.back();
	}, [router, trigger]);

	return (
		<div className="h-full flex flex-col">
			<div className="flex justify-between">
				<Button variant="startBack" onClick={handleBack}>
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
				value={value}
				onChange={handleInputChange}
				onEnterKey={handleFinish}
				error={error}
				errorTitle="Неверный пароль"
			/>
			<div className="mt-auto">
				<Button variant="start" size="start" onClick={handleFinish}>
					Готово
				</Button>
			</div>
		</div>
	);
});

LoginPassword.displayName = "LoginPassword";
