"use client";

import { DayPicker } from "react-day-picker";
import { ru } from "date-fns/locale";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import "react-day-picker/style.css";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import styles from "./DateTimeSelector.module.css";
import { TimeSelect } from "../../TimeSelect";

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

// кастомный форматтер месяца
const customFormatters = {
	formatCaption: (month: Date) => capitalize(format(month, "LLLL yyyy", { locale: ru })),
};

interface Props {
	value: Date;
	onChange: (date: Date) => void;
}

export const DateTimeSelector = ({ value, onChange }: Props) => {
	const [selected, setSelected] = useState<Date>(value);
	const [selectedTime, setSelectedTime] = useState<string>(() => {
		return value.toTimeString().slice(0, 5);
	});

	useEffect(() => {
		const [h, m] = selectedTime.split(":");
		const newDate = new Date(selected);
		newDate.setHours(parseInt(h, 10));
		newDate.setMinutes(parseInt(m, 10));
		onChange(newDate);
	}, [selected, selectedTime, onChange]);

	return (
		<Card className={styles.card}>
			<CardContent className="px-4">
				<DayPicker
					animate
					mode="single"
					selected={selected}
					onSelect={setSelected}
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
				<TimeSelect value={selectedTime} onChange={setSelectedTime} />
			</CardContent>
		</Card>
	);
};
