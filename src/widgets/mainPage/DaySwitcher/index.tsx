import { motion } from "framer-motion";
import { Timestamp } from "firebase/firestore";
import { useRef, useEffect, useState } from "react";
import { addDays, format, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import styles from "./DaysSwitcher.module.css";

export default function DaysSwitcher() {
  const baseDate = new Date();
  const initialDays = Array.from({ length: 30 }).map((_, i) => addDays(baseDate, i - 15)); // создаём массив дней ±15 от сегодняшней даты
  const today = new Date();
  const [days, setDays] = useState<Date[]>(initialDays);
	const [selectedDate, setSelectedDate] = useState<Date>(today);
	const [selectedTimestamp, setSelectedTimestamp] = useState<Timestamp>(Timestamp.fromDate(today));
  const viewportRef = useRef<HTMLDivElement>(null);

  const appendDays = (count = 15) => {
    const last = days[days.length - 1];
    const more = Array.from({ length: count }).map((_, i) => addDays(last, i + 1));
    setDays(prev => [...prev, ...more]);
  };

  const prependDays = (count = 15) => {
    const first = days[0];
    const more = Array.from({ length: count }).map((_, i) => addDays(first, -(count - i)));
    setDays(prev => [...more, ...prev]);
  };

	// вычисляем индекс выбранного дня при каждом рендере
	const selectedIndex = days.findIndex(d => isSameDay(d, selectedDate));

        // скроллим к выбранному дню при изменении списка дней или выбора
        useEffect(() => {
                if (selectedIndex !== -1) {
                        scrollToIndex(selectedIndex);
                }
        }, [selectedIndex, days]);

        // добавляем дни при прокрутке к краям
        useEffect(() => {
                const viewport = viewportRef.current;
                if (!viewport) return;

                const handleScroll = () => {
                        const { scrollLeft, scrollWidth, clientWidth } = viewport;
                        const threshold = 100;
                        if (scrollLeft + clientWidth >= scrollWidth - threshold) {
                                appendDays();
                        } else if (scrollLeft <= threshold) {
                                prependDays();
                        }
                };

                viewport.addEventListener("scroll", handleScroll);
                return () => viewport.removeEventListener("scroll", handleScroll);
        }, [days]);

	const scrollToIndex = (index: number) => {
		const viewport = viewportRef.current;
		if (!viewport) return;

		const dayEl = viewport.children[index] as HTMLElement;
		if (!dayEl) return;

		const viewportRect = viewport.getBoundingClientRect();
		const dayRect = dayEl.getBoundingClientRect();

		const delta = dayRect.left - viewportRect.left;
		const scrollLeft = viewport.scrollLeft + delta - (viewportRect.width / 2 - dayRect.width / 2);

		viewport.scrollTo({ left: scrollLeft, behavior: "smooth" });
	};

        const handleSelect = (index: number) => {
                const date = days[index];
                setSelectedDate(date);
                setSelectedTimestamp(Timestamp.fromDate(date));

                if (index >= days.length - 5) {
                        appendDays();
                } else if (index <= 5) {
                        prependDays();
                }

                scrollToIndex(index);
        };

	return (
		<div className={`${styles.wrapper} ${selectedDate ? styles.active : ""}`}>
			<div className={styles.viewport} ref={viewportRef}>
				{days.map((day, i) => {
					const isActive = isSameDay(day, selectedDate);
					const isNext = i === selectedIndex + 1;
					const weekday = format(day, "EEEEEE", { locale: ru }).slice(0, 2);

					return (
						<div
							key={day.getTime()}
							className={`${styles.dayColumn} ${isNext ? styles.nextDay : ""} ${
								isActive ? styles.activeColumn : ""
							}`}
						>
							<motion.button
								onClick={() => handleSelect(i)}
								className={`${styles.buttonWrapper} ${isActive ? styles.activeDay : ""}`}
								animate={{
									scale: isActive ? 1.2 : 1,
									zIndex: isActive ? 2 : 1,
								}}
								transition={{ type: "spring", stiffness: 300, damping: 25 }}
							>
								<span className={styles.dayNumber}>{format(day, "d")}</span>
							</motion.button>
							<span className={styles.dayName}>{weekday}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}
