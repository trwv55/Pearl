"use client";

import { Button } from "@/components/ui/button";
import { AuthBack } from "@/shared/icons/AuthBack";
import { useRouter } from "next/navigation";
import { startBackText } from "@/features/auth/lib/classNames";
import { AuthInput } from "../../shared/AuthInput/Index";
import { memo, useCallback, useState } from "react";
import { emailSchema } from "../../lib/yupShemas";

interface StepEmailProps {
	onChange: (value: string) => void;
	onNext: () => void;
}

export const LoginEmail = memo(({ onChange, onNext }: StepEmailProps) => {
	const router = useRouter();
	const [localEmail, setLocalEmail] = useState("");
	const [error, setError] = useState(false);

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
			onChange(localEmail);
			onNext();
		} catch {
			setError(true);
		}
	};

	return (
		<div className="h-full flex flex-col">
			<div className="flex justify-between">
				<Button variant="startBack" onClick={() => router.back()}>
					<AuthBack className="w-[6px] h-[10px]" />
					Назад
				</Button>
			</div>
			<div className={`${startBackText} mt-[40px]`}>Шаг 1/2</div>
			<AuthInput
				title="Введи свой email"
				icon="✉️"
				placeholder="Email"
				value={localEmail}
				onChange={handleInputChange}
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
