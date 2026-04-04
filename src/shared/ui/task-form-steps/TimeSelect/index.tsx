import { useMemo } from "react";
import { useWebHaptics } from "web-haptics/react";
import { HAPTIC_LIGHT } from "@/shared/lib/haptics";
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

interface Props {
	value: string;
	onChange: (value: string) => void;
	interval?: number;
	placeholderLabel?: string;
}

export const TimeSelect = ({ value, onChange, interval = 5, placeholderLabel = "--:--" }: Props) => {
	const timeOptions = useMemo(() => generateTimeOptions(interval), [interval]);
	const selectClassName = value ? styles.select : `${styles.select} ${styles.placeholderCentered}`;
	const { trigger } = useWebHaptics();

	const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		onChange(e.target.value);
	};

	return (
		<div className="flex justify-between items-center mt-[15px]">
			<span className={styles.timeLabel}>Время</span>
			<select value={value} onChange={handleChange} className={selectClassName}>
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
