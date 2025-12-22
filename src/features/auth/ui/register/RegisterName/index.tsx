"use client";

import { Button } from "@/shared/ui/button";
import { AuthBack } from "@/shared/assets/icons/AuthBack";
import { startBackText } from "@/features/auth/lib/classNames";
import { AuthInput } from "../../shared/AuthInput/Index";
import { memo, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
	onChange: (value: string) => void;
	onNext: () => void;
	onPrev: () => void;
}

export const RegisterName = memo(({ onChange, onNext, onPrev }: Props) => {
	const router = useRouter();
	const [localName, setLocalName] = useState("");
	const [error, setError] = useState(false);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setLocalName(e.target.value);
			if (error) setError(false);
		},
		[error],
	);

	const handleNext = () => {
		if (!localName.trim()) {
			setError(true);
			return;
		}
		onChange(localName);
		onNext();
	};

	return (
		<div className="h-full flex flex-col">
			<div className="flex justify-between">
				<Button variant="startBack" onClick={() => router.back()}>
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
