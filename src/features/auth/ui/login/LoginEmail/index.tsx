"use client";

import { Button } from "@/shared/ui/button";
import { AuthBack } from "@/shared/assets/icons/AuthBack";
import { useRouter } from "next/navigation";
import { startBackText } from "@/features/auth/lib/classNames";
import { AuthInput } from "../../shared/AuthInput/Index";
import { memo, useCallback, useState } from "react";
import { emailSchema } from "../../../lib/yupShemas";
import styles from "./LoginEmail.module.css";

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
		router.back();
	}, [router]);

	return (
		<div className={styles.container}>
			<div className={styles.content}>
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
					errorTitle="Неверный email"
					error={error}
				/>
				<div className="mt-auto">
					<Button variant="start" size="start" onClick={handleNext}>
						Далее
					</Button>
				</div>
			</div>
		</div>
	);
});

LoginEmail.displayName = "LoginEmail";
