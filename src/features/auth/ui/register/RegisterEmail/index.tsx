"use client";

import { Button } from "@/shared/ui/button";
import { AuthBack } from "@/shared/assets/icons/AuthBack";
import { useRouter } from "next/navigation";
import { startBackText } from "@/features/auth/lib/classNames";
import { AuthInput } from "../../shared/AuthInput/Index";
import { memo, useCallback, useState } from "react";
import { emailSchema } from "../../../lib/yupShemas";
import { ROUTES } from "@/shared/lib/routes";
import { useWebHaptics } from "web-haptics/react";
import { HAPTIC_LIGHT, HAPTIC_ERROR } from "@/shared/lib/haptics";

interface StepEmailProps {
	onChange: (value: string) => void;
	onNext: () => void;
}

export const RegisterEmail = memo(({ onChange, onNext }: StepEmailProps) => {
	const router = useRouter();
	const [localEmail, setLocalEmail] = useState("");
	const [error, setError] = useState(false);
	const { trigger } = useWebHaptics();

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setLocalEmail(e.target.value);
			if (error) setError(false);
		},
		[error],
	);

	const handleNext = async () => {
		try {
			await emailSchema.validate({ email: localEmail });
			setError(false);
			trigger(...HAPTIC_LIGHT);
			onChange(localEmail);
			onNext();
		} catch {
			trigger(HAPTIC_ERROR);
			setError(true);
		}
	};

	const handleBack = useCallback(() => {
		trigger(...HAPTIC_LIGHT);
		if (typeof window !== "undefined" && window.history.length > 1) {
			router.back();
		} else {
			router.push(ROUTES.HOME);
		}
	}, [router, trigger]);

	return (
		<div className="h-full flex flex-col">
			<div className="flex justify-between">
				<Button variant="startBack" onClick={handleBack}>
					<AuthBack className="w-[6px] h-[10px]" />
					Назад
				</Button>
			</div>
			<div className={`${startBackText} mt-[40px]`}>Шаг 1/5</div>
			<AuthInput
				title="Укажи свой email"
				icon="✉️"
				placeholder="Email"
				value={localEmail}
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

RegisterEmail.displayName = "RegisterEmail";
