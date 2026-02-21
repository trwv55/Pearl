import { useMemo } from "react";
import styles from "./TimeSelect.module.css";

const generateTimeOptions = (interval = 30) => {
	const times: string[] = [];
	for (let hour = 0; hour < 24; hour++) {
		for (let min = 0; min < 60; min += interval) {
			const hh = hour.toString().padStart(2, "0");
			const mm = min.toString().padStart(2, "0");
			times.push(`${hh}:${mm}`);
		}
	}
	return times;
};

const roundToInterval = (date: Date, interval = 30) => {
	const hours = date.getHours();
	const minutes = date.getMinutes();
	const roundedMinutes = Math.round(minutes / interval) * interval;
	const adjustedMinutes = roundedMinutes === 60 ? 0 : roundedMinutes;
	const adjustedHours = roundedMinutes === 60 ? hours + 1 : hours;
	const hh = adjustedHours.toString().padStart(2, "0");
	const mm = adjustedMinutes.toString().padStart(2, "0");
	return `${hh}:${mm}`;
};

interface Props {
	value: string;
	onChange: (value: string) => void;
	interval?: number;
	placeholderLabel?: string;
}

export const TimeSelect = ({ value, onChange, interval = 5, placeholderLabel = "--:--" }: Props) => {
	const timeOptions = useMemo(() => generateTimeOptions(interval), [interval]);
	const selectClassName = value ? styles.select : `${styles.select} ${styles.placeholderCentered}`;

	return (
		<div className="flex justify-between items-center mt-[15px]">
			<span className={styles.timeLabel}>Время</span>
			<select value={value} onChange={(e) => onChange(e.target.value)} className={selectClassName}>
				{/* Плейсхолдер: выбран при value="" */}
				<option value="">{placeholderLabel}</option>

				{timeOptions.map((time) => (
					<option key={time} value={time}>
						{time}
					</option>
				))}
			</select>
		</div>
	);
};
