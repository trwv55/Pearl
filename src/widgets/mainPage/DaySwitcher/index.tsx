import { motion } from "framer-motion";
import { Timestamp } from "firebase/firestore";
import { useRef, useLayoutEffect, useEffect, useState } from "react";
import { addDays, format, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import styles from "./DaysSwitcher.module.css";

const INITIAL_RANGE = 3;
const BATCH_SIZE = 10;

interface DaysSwitcherProps {
	value: Date;
	onChange: (date: Date) => void;
}

export default function DaysSwitcher({ value, onChange }: DaysSwitcherProps) {
        const [selectedDate, setSelectedDate] = useState<Date>(value);
        const [selectedTimestamp, setSelectedTimestamp] = useState<Timestamp>(Timestamp.fromDate(value));
        const [days, setDays] = useState<Date[]>(() =>
                Array.from({ length: INITIAL_RANGE * 2 + 1 }).map((_, i) => addDays(value, i - INITIAL_RANGE)),
        );
	const viewportRef = useRef<HTMLDivElement>(null);

	const selectedIndex = days.findIndex(d => isSameDay(d, selectedDate));

	useEffect(() => {
		setSelectedDate(value);
		setSelectedTimestamp(Timestamp.fromDate(value));
	}, [value]);

       // Initial scroll to the selected date without animation
       useLayoutEffect(() => {
               if (selectedIndex !== -1 && viewportRef.current) {
                       scrollToIndex(selectedIndex, "auto");
               }
       }, []);

       // Scroll smoothly when selected index changes after mount
       useEffect(() => {
               if (selectedIndex !== -1 && viewportRef.current) {
                       scrollToIndex(selectedIndex, "smooth");
               }
       }, [selectedIndex]);

       const scrollToIndex = (index: number, behavior: ScrollBehavior = "smooth") => {
               const viewport = viewportRef.current;
               if (!viewport) return;
               const dayEl = viewport.children[index] as HTMLElement;
               if (!dayEl) return;
               const viewportRect = viewport.getBoundingClientRect();
               const dayRect = dayEl.getBoundingClientRect();
               const delta = dayRect.left - viewportRect.left;
               const scrollLeft = viewport.scrollLeft + delta - (viewportRect.width / 2 - dayRect.width / 2);
               viewport.scrollTo({ left: scrollLeft, behavior });
       };

	const handleSelect = (index: number) => {
		const date = uniqueDays[index];
		setSelectedDate(date);
		setSelectedTimestamp(Timestamp.fromDate(date));
		onChange(date);
		scrollToIndex(index);
	};

        useEffect(() => {
                if (!days.some(d => isSameDay(d, value))) {
                        const newDays = Array.from({ length: INITIAL_RANGE * 2 + 1 }).map((_, i) =>
                                addDays(value, i - INITIAL_RANGE),
                        );
                        setDays(newDays);
                }
        }, [value]);

	const prependDays = (count: number) => {
		const first = days[0];
		const newDays: Date[] = [];
		for (let i = count; i > 0; i--) {
			const candidate = addDays(first, -i);
			newDays.push(candidate);
		}
		setDays(prev => [...newDays, ...prev]);

		// Компенсация скролла
		const viewport = viewportRef.current;
		if (viewport) {
			const firstChild = viewport.children[0] as HTMLElement | undefined;
			const width = firstChild?.offsetWidth ?? 40;
			viewport.scrollLeft += count * width;
		}
	};

	const appendDays = (count: number) => {
		const last = days[days.length - 1];
		const newDays: Date[] = [];
		for (let i = 1; i <= count; i++) {
			const candidate = addDays(last, i);
			newDays.push(candidate);
		}
		setDays(prev => [...prev, ...newDays]);
	};

	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;

		const handleScroll = () => {
			const { scrollLeft, scrollWidth, clientWidth } = viewport;

			if (scrollLeft < 60) {
				prependDays(BATCH_SIZE);
			}
			if (scrollLeft + clientWidth > scrollWidth - 60) {
				appendDays(BATCH_SIZE);
			}
		};

		viewport.addEventListener("scroll", handleScroll);
		return () => viewport.removeEventListener("scroll", handleScroll);
	}, [days]);

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
							key={day.toDateString()}
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
