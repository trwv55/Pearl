import { useEffect, useState, useMemo } from "react";
import useEmblaCarousel from "embla-carousel-react";
import AutoHeight from "embla-carousel-auto-height";
import { EmptyTaskState } from "../shared/EmptyTaskState";
import type { TaskMain } from "@/entities/task/types";
import { MainTaskStack } from "@/features/dashboard/ui/MainTaskStack";
import { taskStore } from "@/entities/task/store";
import { observer } from "mobx-react-lite";
import WeeklyStats from "../../WeeklyStats";
import styles from "./TasksAndStatsWidget.module.css";
import { statsStore } from "@/entities/stats/store";

interface ShowMainTasksProps {
	tasks: TaskMain[];
	showDots?: boolean;
}

export const TasksAndStatsWidget = observer(({ tasks, showDots }: ShowMainTasksProps) => {
	const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false }, [AutoHeight()]);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
	const [isStackExpanded, setIsStackExpanded] = useState(false); // Флаг открытия стопки главных задач

	// Сбрасываем состояние стопки при смене дня
	useEffect(() => {
		setIsStackExpanded(false);
	}, [taskStore.selectedDate]);

	// автоматически передвигает dots при переключении слайдов
	useEffect(() => {
		if (!emblaApi) return;
		emblaApi.reInit();
	}, [emblaApi, isStackExpanded, tasks.length, statsStore.weekStats]);

	// инициализация слайдера
	useEffect(() => {
		if (!emblaApi) return;

		const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());

		setScrollSnaps(emblaApi.scrollSnapList());
		emblaApi.on("select", onSelect);
		onSelect();

		return () => {
			emblaApi.off("select", onSelect);
		};
	}, [emblaApi]);

	const stackTasks = useMemo<(TaskMain | null)[]>(() => {
		if (tasks.length === 0) return [];
		if (!isStackExpanded) return tasks;
		return [...tasks, ...Array(Math.max(0, 3 - tasks.length)).fill(null)];
	}, [tasks, isStackExpanded]);

	// Мемоизированный первый слайд
	const firstSlide = useMemo(() => {
		if (tasks.length === 0)
			return (
				<EmptyTaskState>
					<span>Отдыхаем!</span>&nbsp;Задач на сегодня нет
				</EmptyTaskState>
			);

		return (
			<div className="flex flex-col gap-2">
				<MainTaskStack
					tasks={stackTasks}
					isExpanded={isStackExpanded}
					onExpandChange={setIsStackExpanded}
					canExpand={tasks.length >= 1}
				/>
			</div>
		);
	}, [tasks, isStackExpanded, stackTasks]);

	// Развернутый режим
	if (isStackExpanded) {
		if (tasks.length === 0) {
			// если после удаления задач не осталось — показываем пустое состояние
			return (
				<EmptyTaskState>
					<span>Отдыхаем!</span>&nbsp;Задач на сегодня нет
				</EmptyTaskState>
			);
		}
		return (
			<div className="w-full">
				<MainTaskStack tasks={stackTasks} isExpanded onExpandChange={setIsStackExpanded} />
				{showDots && (
					<div className={styles.dotsWrap}>
						<button onClick={() => setIsStackExpanded(false)} className={styles.closeLine} />
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="w-full">
			<div className="overflow-hidden" ref={emblaRef}>
				<div className="flex items-start">
					{/* Слайд 1 */}
					<div className="flex-[0_0_100%]">{firstSlide}</div>
					{/* Слайд 2 */}
					<div className="flex-[0_0_100%]">
						<WeeklyStats />
					</div>
				</div>
			</div>

			{/* 🔵 Точки переключения */}
			{showDots && (
				<div className={styles.dotsWrap}>
					{scrollSnaps.map((_, index) => (
						<button
							key={index}
							onClick={() => emblaApi && emblaApi.scrollTo(index)}
							className={`${styles.dot} ${selectedIndex === index ? styles.dotActive : ""}`}
						/>
					))}
				</div>
			)}
		</div>
	);
});
