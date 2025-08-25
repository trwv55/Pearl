"use client";

import { DateTimeSelector } from "./DateTimeSelector";
import styles from "../shared/styles.module.css";
import { memo } from "react";

interface Props {
        value: Date;
        onChange: (date: Date) => void;
        onTimeChange?: (time: string) => void;
}
function StepCalendar({ value, onChange, onTimeChange }: Props) {
	return (
		<div className={styles.wrap}>
			<div className={styles.labelWrap}>
				<div className={styles.label}>
					<span>Шаг 3/6: </span>
					Когда это произойдет?
				</div>
			</div>

                        <div className={styles.calendarWrap}>
                                <DateTimeSelector value={value} onChange={onChange} onTimeChange={onTimeChange} />
                        </div>
                </div>
        );
}

export default memo(StepCalendar);
