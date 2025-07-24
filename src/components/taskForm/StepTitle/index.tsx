"use client";
import { memo } from "react";
import styles from "./StepTitle.module.css";

interface StepTitleProps {
	placeholder?: string;
	note?: string;
	rows?: number;
	value?: string;
	onChange?: (value: string) => void;
}

function StepTitle({
	placeholder = "Сюда пиши текст...",
	note = "Не больше 3-х строк",
	rows = 3,
	value,
	onChange,
}: StepTitleProps) {
	return (
		<div className={styles.wrap}>
			<div className={styles.textareaWrap}>
				<textarea
					className={styles.textarea}
					placeholder={placeholder}
					rows={rows}
					style={{ lineHeight: "120%" }}
					value={value}
					onChange={e => onChange?.(e.target.value)}
				/>
				<span>{note}</span>
			</div>
		</div>
	);
}

export default memo(StepTitle);
