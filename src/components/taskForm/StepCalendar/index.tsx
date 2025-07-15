"use client";

import { DateTimeSelector } from "./DateTimeSelector";
import styles from "../shared/styles.module.css";

export default function StepCalendar() {
	return (
		<div className={styles.wrap}>
			<div className={styles.labelWrap}>
				<div className={styles.label}>
					<span>Шаг 3/6: </span>
					Когда это произойдет?
				</div>
			</div>

			<div className={styles.calendarWrap}>
				<DateTimeSelector />
			</div>
		</div>
	);
}
