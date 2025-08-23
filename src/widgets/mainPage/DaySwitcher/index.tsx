import { Timestamp } from "firebase/firestore";
import { useRef, useLayoutEffect, useEffect, useState, useMemo } from "react";
import { addDays, format, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import styles from "./DaysSwitcher.module.css";
import Day from "./Day";

const INITIAL_RANGE = 3;
const BATCH_SIZE = 10;
const MAX_DAYS = 21;

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

	// вычисляем подпись месяца и года под текущую выбранную дату
	const { monthTitle, yearTitle } = useMemo(() => {
		// "LLL" в ru даёт "июн."; убираем точку и капитализуем
		const raw = format(selectedDate, "LLL", { locale: ru }); // напр. "июн."
		const withoutDot = raw.replace(".", "");
		const cap = withoutDot.charAt(0).toUpperCase() + withoutDot.slice(1);
		return { monthTitle: cap, yearTitle: format(selectedDate, "yyyy") };
	}, [selectedDate]);

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
			const newDays = Array.from({ length: INITIAL_RANGE * 2 + 1 }).map((_, i) => addDays(value, i - INITIAL_RANGE));
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
	const activeIndex = uniqueDays.findIndex(d => isSameDay(d, selectedDate));

	return (
		<div className={`${styles.wrapper} ${selectedDate ? styles.active : ""}`}>
			<div className={styles.header}>
				<div className={styles.monthBox}>
					<div className={styles.monthLine}>
						<span className={styles.month}>{monthTitle}</span>
						<span className={styles.comma}>,</span>
					</div>
					<div className={styles.year}>{yearTitle}</div>
				</div>

				<div className={styles.separator} />
				<div className={styles.viewport} ref={viewportRef} style={{ overflowX: "auto", whiteSpace: "nowrap" }}>
					{uniqueDays.map((day, i) => (
						<Day
							key={day.toDateString()}
							day={day}
							isActive={i === activeIndex}
							isNext={i === activeIndex + 1}
							onSelect={() => handleSelect(i)}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
