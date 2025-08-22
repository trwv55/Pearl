import { useEffect, useCallback, useState, useMemo } from "react";
import useEmblaCarousel from "embla-carousel-react";
import styles from "./ShowTasks.module.css";
import { EmptyTaskState } from "../shared/EmptyTaskState";
import type { TaskMain } from "@/entities/task/types";
import { MainTaskStack } from "@/components/dashboard/MainTaskStack";
import { taskStore } from "@/entities/task/store";
import { observer } from "mobx-react-lite";

interface ShowMainTasksProps {
	tasks: TaskMain[];
	showDots?: boolean;
}

export const ShowMainTasks = observer(({ tasks, showDots }: ShowMainTasksProps) => {
	const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
	const [isStackExpanded, setIsStackExpanded] = useState(false); // Флаг открытия стопки главных задач

	// Сбрасываем состояние стопки при смене дня
	useEffect(() => {
		setIsStackExpanded(false);
	}, [taskStore.selectedDate]);

	// следим за изменением выбранного слайда
	// const onSelect = useCallback(() => {
	// 	if (!emblaApi) return;
	// 	setSelectedIndex(emblaApi.selectedScrollSnap());
	// }, [emblaApi]);

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
					tasks={tasks}
					isExpanded={isStackExpanded}
					onExpandChange={setIsStackExpanded}
					canExpand={tasks.length >= 1}
				/>
			</div>
		);
	}, [tasks, isStackExpanded]);

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
				<MainTaskStack tasks={tasks} isExpanded onExpandChange={setIsStackExpanded} />
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
				<div className="flex">
					{/* Слайд 1 */}
					<div className="flex-[0_0_100%]">{firstSlide}</div>
					{/* Слайд 2 (пока пустой) */}
					<div className="flex-[0_0_100%] px-4">
						<div className="">Пустой слайд</div>
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
