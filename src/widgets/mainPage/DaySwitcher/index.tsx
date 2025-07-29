import { motion } from "framer-motion";
import { Timestamp } from "firebase/firestore";
import { useRef, useLayoutEffect, useEffect, useState } from "react";
import { addDays, format, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import styles from "./DaysSwitcher.module.css";

const INITIAL_RANGE = 10;
const BATCH_SIZE = 15;

export default function DaysSwitcher() {
	const today = new Date();
	const [days, setDays] = useState<Date[]>(() =>
		Array.from({ length: INITIAL_RANGE * 2 }).map((_, i) => addDays(today, i - INITIAL_RANGE)),
	);
	const [selectedDate, setSelectedDate] = useState<Date>(today);
	const [selectedTimestamp, setSelectedTimestamp] = useState<Timestamp>(Timestamp.fromDate(today));
	const viewportRef = useRef<HTMLDivElement>(null);

	const selectedIndex = days.findIndex(d => isSameDay(d, selectedDate));

	// Гарантируем, что today всегда в массиве дней
	useEffect(() => {
		if (!days.some(d => isSameDay(d, today))) {
			setDays(prev => [...prev, today]);
		}
	}, [days]);

	// Скроллим к сегодняшнему дню при первом рендере или если today добавлен
	useLayoutEffect(() => {
		if (selectedIndex !== -1 && viewportRef.current) {
			scrollToIndex(selectedIndex);
		}
	}, [selectedIndex]);

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
		const date = uniqueDays[index];
		setSelectedDate(date);
		setSelectedTimestamp(Timestamp.fromDate(date));
		scrollToIndex(index);
	};

	const prependDays = (count: number) => {
		const first = days[0];
		const newDays: Date[] = [];
		for (let i = count; i > 0; i--) {
			const candidate = addDays(first, -i);
			if (!days.some(d => isSameDay(d, candidate))) {
				newDays.push(candidate);
			}
		}
		setDays(prev => [...newDays, ...prev]);
		// Корректируем scrollLeft чтобы визуально ничего не скакало
		const viewport = viewportRef.current;
		if (viewport) {
			const firstChild = viewport.children[0] as HTMLElement | undefined;
			const width = firstChild?.offsetWidth ?? 40;
			viewport.scrollLeft += BATCH_SIZE * width;
		}
	};

	const appendDays = (count: number) => {
		const last = days[days.length - 1];
		const newDays: Date[] = [];
		for (let i = 1; i <= count; i++) {
			const candidate = addDays(last, i);
			if (!days.some(d => isSameDay(d, candidate))) {
				newDays.push(candidate);
			}
		}
		setDays(prev => [...prev, ...newDays]);
	};

	// Обработка скролла только у viewport
	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;

		const handleScroll = () => {
			const { scrollLeft, scrollWidth, clientWidth } = viewport;

			// Левый край
			if (scrollLeft < 60) {
				prependDays(BATCH_SIZE);
			}
			// Правый край
			if (scrollLeft + clientWidth > scrollWidth - 60) {
				appendDays(BATCH_SIZE);
			}
		};

		viewport.addEventListener("scroll", handleScroll);
		return () => viewport.removeEventListener("scroll", handleScroll);
	}, [days]);

	// --- УНИКАЛЬНЫЕ ДНИ для рендера! ---
	const uniqueDays = days
		.slice()
		.sort((a, b) => a.getTime() - b.getTime())
		.filter((day, i, arr) => i === 0 || !isSameDay(day, arr[i - 1]));

	return (
		<div className={`${styles.wrapper} ${selectedDate ? styles.active : ""}`}>
			<div className={styles.viewport} ref={viewportRef} style={{ overflowX: "auto", whiteSpace: "nowrap" }}>
				{uniqueDays.map((day, i) => {
					const isActive = isSameDay(day, selectedDate);
					const isNext = i === uniqueDays.findIndex(d => isSameDay(d, selectedDate)) + 1;
					const weekday = format(day, "EEEEEE", { locale: ru }).slice(0, 2);

					return (
						<div
							key={day.toISOString()}
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
