"use client";

import { DayPicker } from "react-day-picker";
import { ru } from "date-fns/locale";
import { format } from "date-fns";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import TimePicker from "react-time-picker";
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

export const DateTimeSelector = () => {
	const [date, setDate] = useState<Date>(new Date());
	const [selected, setSelected] = useState<Date>();
	const [selectedTime, setSelectedTime] = useState<string>(() => {
		const now = new Date();
		return now.toTimeString().slice(0, 5); // "11:38"
	});

	return (
		<Card className={styles.card}>
			<CardContent className="px-4">
				<DayPicker
					animate
					mode="single"
					selected={selected}
					onSelect={setSelected}
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
				<TimeSelect />
			</CardContent>
		</Card>
	);
};
