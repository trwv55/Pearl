"use client";

import { Button } from "@/shared/ui/button";
import { AuthBack } from "@/shared/assets/icons/AuthBack";
import { startBackText } from "@/features/auth/lib/classNames";
import { AuthInput } from "../../shared/AuthInput/Index";
import { memo, useCallback, useState } from "react";
import * as yup from "yup";
import { registerPasswordSchema } from "../../../lib/yupShemas";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/lib/routes";
import { useHaptics } from "@/shared/hooks/useHaptics";
import { HAPTIC_LIGHT, HAPTIC_ERROR } from "@/shared/lib/haptics";

interface Props {
	onChange: (value: string) => void;
	onNext: () => void;
	onPrev: () => void;
}

export const RegisterPassword = memo(({ onChange, onNext, onPrev }: Props) => {
	const router = useRouter();
	const [localPassword, setLocalPassword] = useState("");
	const [errorMsg, setErrorMsg] = useState("");
	const { trigger } = useHaptics();

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setLocalPassword(e.target.value);
			if (errorMsg) setErrorMsg("");
		},
		[errorMsg],
	);

	const handleNext = async () => {
		try {
			await registerPasswordSchema.validate({ password: localPassword });
			setErrorMsg("");
			trigger(...HAPTIC_LIGHT);
			onChange(localPassword);
			onNext();
		} catch (e) {
			trigger(HAPTIC_ERROR);
			setErrorMsg(e instanceof yup.ValidationError ? e.message : "Неверный пароль");
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
				error={!!errorMsg}
				errorTitle={errorMsg}
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
