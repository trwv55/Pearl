"use client";
import { memo, useMemo } from "react";
import styles from "./StepTitle.module.css";

interface StepTitleProps {
	placeholder?: string;
	note?: string;
	rows?: number;
	value?: string;
	onChange?: (value: string) => void;
	error?: boolean;
	onErrorClear?: () => void;
}

function StepTitle({
	placeholder = "Сюда пиши текст...",
	note = "Не больше 3-х строк",
	rows = 3,
	value,
	onChange,
	error,
	onErrorClear,
}: StepTitleProps) {
	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const value = e.target.value;
		onChange?.(value);
		// если есть ошибка — снимаем её при любом вводе
		if (error) onErrorClear?.();
	};

	return (
		<div className={styles.wrap}>
			<div className={styles.textareaWrap}>
				<textarea
					className={`${styles.textarea} ${error ? styles.error : ""}`}
					placeholder={placeholder}
					rows={rows}
					style={{ lineHeight: "120%" }}
					value={value}
					onChange={handleChange}
				/>
				<span>{note}</span>
			</div>
		</div>
	);
}

export default memo(StepTitle);
