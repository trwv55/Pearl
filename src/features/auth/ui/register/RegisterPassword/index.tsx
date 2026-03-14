"use client";

import { Button } from "@/shared/ui/button";
import { AuthBack } from "@/shared/assets/icons/AuthBack";
import { startBackText } from "@/features/auth/lib/classNames";
import { AuthInput } from "../../shared/AuthInput/Index";
import { memo, useCallback, useState } from "react";
import { passwordSchema } from "../../../lib/yupShemas";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/lib/routes";
import { useWebHaptics } from "web-haptics/react";
import { HAPTIC_LIGHT, HAPTIC_ERROR } from "@/shared/lib/haptics";

interface Props {
	onChange: (value: string) => void;
	onNext: () => void;
	onPrev: () => void;
}

export const RegisterPassword = memo(({ onChange, onNext, onPrev }: Props) => {
	const router = useRouter();
	const [localPassword, setLocalPassword] = useState("");
	const [error, setError] = useState(false);
	const { trigger } = useWebHaptics();

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setLocalPassword(e.target.value);
			if (error) setError(false);
		},
		[error],
	);

	const handleNext = async () => {
		try {
			await passwordSchema.validate({ password: localPassword });
			setError(false);
			trigger(...HAPTIC_LIGHT);
			onChange(localPassword);
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
			<div className={`${startBackText} mt-[40px]`}>Шаг 2/5</div>
			<AuthInput
				type="password"
				title="Теперь придумай пароль"
				icon="🔐️"
				placeholder="Пароль"
				value={localPassword}
				onChange={handleInputChange}
				onEnterKey={handleNext}
				error={error}
				errorTitle="Неверный пароль"
			/>
			<div className="mt-auto">
				<Button variant="start" size="start" onClick={handleNext}>
					Далее
				</Button>
			</div>
		</div>
	);
});

RegisterPassword.displayName = "RegisterPassword";
