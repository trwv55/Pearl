"use client";

import { Button } from "@/shared/ui/button";
import { AuthBack } from "@/shared/assets/icons/AuthBack";
import { startBackText } from "@/features/auth/lib/classNames";
import { AuthInput } from "../../shared/AuthInput/Index";
import { memo, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/lib/routes";
import { useWebHaptics } from "web-haptics/react";
import { HAPTIC_LIGHT, HAPTIC_ERROR } from "@/shared/lib/haptics";

interface Props {
	onChange: (value: string) => void;
	onNext: () => void;
	onPrev: () => void;
}

export const RegisterName = memo(({ onChange, onNext, onPrev }: Props) => {
	const router = useRouter();
	const [localName, setLocalName] = useState("");
	const [error, setError] = useState(false);
	const { trigger } = useWebHaptics();

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setLocalName(e.target.value);
			if (error) setError(false);
		},
		[error],
	);

	const handleNext = () => {
		if (!localName.trim()) {
			trigger(HAPTIC_ERROR);
			setError(true);
			return;
		}
		trigger(...HAPTIC_LIGHT);
		onChange(localName);
		onNext();
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
			<div className={`${startBackText} mt-[40px]`}>Шаг 4/5</div>
			<AuthInput
				title="Как тебя зовут?"
				icon="✍️"
				placeholder="Имя"
				value={localName}
				onChange={handleInputChange}
				onEnterKey={handleNext}
				error={error}
				errorTitle="Введите имя"
			/>
			<div className="mt-auto">
				<Button variant="start" size="start" onClick={handleNext}>
					Далее
				</Button>
			</div>
		</div>
	);
});

RegisterName.displayName = "RegisterName";
