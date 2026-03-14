import { useEffect, useState, useMemo } from "react";
import useEmblaCarousel from "embla-carousel-react";
import AutoHeight from "embla-carousel-auto-height";
import { EmptyTaskState } from "@/shared/ui/EmptyTaskState";
import type { TaskMain } from "@/shared/types/task";
import { MainTaskStack } from "@/features/main-tasks";
import { taskStore } from "@/shared/model/taskStore";
import { observer } from "mobx-react-lite";
import WeeklyStats from "@/widgets/WeeklyStats";
import styles from "./TasksAndStatsWidget.module.css";
import { statsStore } from "@/shared/model/statsStore";

interface ShowMainTasksProps {
	tasks: TaskMain[];
	showDots?: boolean;
	isStackExpanded?: boolean;
	onExpandChange?: (expanded: boolean) => void;
}

export const TasksAndStatsWidget = observer(({ tasks, showDots, isStackExpanded: controlledExpanded, onExpandChange }: ShowMainTasksProps) => {
	const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false }, [AutoHeight()]);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
	const [internalExpanded, setInternalExpanded] = useState(false);

	const isControlled = controlledExpanded !== undefined;
	const isStackExpanded = isControlled ? controlledExpanded : internalExpanded;
	const setIsStackExpanded = isControlled
		? (onExpandChange ?? (() => {}))
		: setInternalExpanded;

	useEffect(() => {
		if (!isControlled) setInternalExpanded(false);
	}, [taskStore.selectedDate, isControlled]);

	useEffect(() => {
		if (!emblaApi) return;
		emblaApi.reInit();
	}, [emblaApi, isStackExpanded, tasks.length, statsStore.weekStats]);

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
	}, [tasks, isStackExpanded, stackTasks])

	if (isStackExpanded) {
		if (tasks.length === 0) {
			return (
				<EmptyTaskState>
					<span>Отдыхаем!</span>&nbsp;Задач на сегодня нет
				</EmptyTaskState>
			);
		}
		return (
			<div className="w-full">
				<MainTaskStack tasks={stackTasks} isExpanded onExpandChange={setIsStackExpanded} />
			</div>
		);
	}

	return (
		<div className="w-full">
			<div className="overflow-hidden" ref={emblaRef}>
				<div className="flex items-start">
					<div className="flex-[0_0_100%]">{firstSlide}</div>
					<div className="flex-[0_0_100%]">
						<WeeklyStats />
					</div>
				</div>
			</div>

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
