"use client";

import { DayPicker } from "react-day-picker";
import { ru } from "date-fns/locale";
import { format, setHours, setMinutes } from "date-fns";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import "react-day-picker/style.css";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import styles from "./DateTimeSelector.module.css";
import { TimeSelect } from "../../TimeSelect";
import { useWebHaptics } from "web-haptics/react";
import { HAPTIC_LIGHT } from "@/shared/lib/haptics";

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const customFormatters = {
	formatCaption: (month: Date) => capitalize(format(month, "LLLL yyyy", { locale: ru })),
};

interface Props {
	value: Date;
	onChange: (date: Date) => void;
	onTimeChange?: (time: string) => void;
	time?: string;
}

export const DateTimeSelector = ({ value, onChange, onTimeChange, time }: Props) => {
	const [selected, setSelected] = useState<Date>(value);
	const [selectedTime, setSelectedTime] = useState<string>(time || "");
	const { trigger } = useWebHaptics();

	const handleSelectDay = (date: Date) => {
		trigger(...HAPTIC_LIGHT);
		setSelected(date);
	};

	const handleMonthChange = () => {
		trigger(...HAPTIC_LIGHT);
	};

	const handleTimeChange = (t: string) => {
		setSelectedTime(t);
		onTimeChange?.(t);
	};

	useEffect(() => {
		if (time !== undefined) {
			setSelectedTime(time);
		}
	}, [time]);

	useEffect(() => {
		let next = new Date(selected);

		if (selectedTime) {
			const [h, m] = selectedTime.split(":");
			next = setHours(next, parseInt(h, 10));
			next = setMinutes(next, parseInt(m, 10));
		} else {
			next = setHours(next, 0);
			next = setMinutes(next, 0);
		}

		onChange(next);
	}, [selected, selectedTime, onChange]);

	return (
		<Card className={styles.card}>
			<CardContent className="px-4">
			<DayPicker
				animate
				mode="single"
				selected={selected}
				onSelect={handleSelectDay}
				onMonthChange={handleMonthChange}
				required
				locale={ru}
				formatters={customFormatters}
					className={styles.root}
					classNames={{
						month: styles.monthsCustom,
						month_caption: styles.caption,
						weekdays: styles.weekdaysCustom,
						today: styles.todayDay,
						selected: styles.selectedDay,
					}}
				/>
				<TimeSelect value={selectedTime} onChange={handleTimeChange} interval={5} placeholderLabel="--:--" />
			</CardContent>
		</Card>
	);
};
