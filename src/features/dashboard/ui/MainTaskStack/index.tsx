import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Task, TaskMain } from "@/entities/task/types";
import { MainTaskItem } from "@/features/dashboard/ui/MainTaskItem";
import { EmptyTaskState } from "@/widgets/mainPage/shared/EmptyTaskState";
import styles from "./MainTaskStack.module.css";
import { userStore } from "@/entities/user/store";
import { taskStore } from "@/entities/task/store";
import { toast } from "sonner";
import { statsStore } from "@/entities/stats/store";
import { startOfWeek } from "date-fns";

interface MainTaskStackProps {
	tasks: (TaskMain | null)[];
	isExpanded?: boolean;
	onExpandChange?: (expanded: boolean) => void;
	canExpand?: boolean;
}

export const MainTaskStack: React.FC<MainTaskStackProps> = ({
	tasks,
	isExpanded: controlledExpanded,
	onExpandChange,
	canExpand,
}) => {
	const [uncontrolledExpanded, setUncontrolledExpanded] = useState(false);
	const isControlled = controlledExpanded !== undefined;
	const isExpanded = isControlled ? controlledExpanded : uncontrolledExpanded; // Раскрытая стопка
	const prevTasksRef = useRef<string>("");
	const firstItemRef = useRef<HTMLDivElement | null>(null);
	const [itemH, setItemH] = useState<number>(0);
	const uid = userStore.user?.uid;

	useEffect(() => {
		if (isControlled) return;
		const ids = tasks.map(t => t?.id).join(",");
		if (prevTasksRef.current !== ids) {
			setUncontrolledExpanded(false);
			prevTasksRef.current = ids;
		}
	}, [tasks, isControlled]);

	useLayoutEffect(() => {
		if (!firstItemRef.current) return;
		const el = firstItemRef.current;

		const update = () => setItemH(el.getBoundingClientRect().height);
		update();

		// следим за изменениями высоты
		const ro = new ResizeObserver(update);
		ro.observe(el);
		return () => ro.disconnect();
	}, [tasks]);

	const handleToggle = useCallback(() => {
		const next = !isExpanded;
		if (!isControlled) {
			setUncontrolledExpanded(next);
		}
		onExpandChange?.(next);
	}, [isExpanded, isControlled, onExpandChange]);

	// Удаление с Undo + автосворачивание стопки
	const handleDelete = useCallback(
		(taskId: string) => {
			if (!uid) {
				toast.error("Нет данных пользователя");
				return;
			}
			const full = tasks.find(t => t?.id === taskId);
			if (!full) return;
			// сразу сворачиваем стопку у родителя
			onExpandChange?.(false);
			if (!isControlled) setUncontrolledExpanded(false);

			taskStore.deleteWithUndo(uid, full);
		},
		[tasks, isControlled, onExpandChange, uid],
	);

	const handleComplete = useCallback(
		async (task: Task) => {
			if (!uid) {
				toast.error("Нет данных пользователя");
				return;
			}
                        await taskStore.toggleCompletion(uid, task.id);
                        const weekStart = startOfWeek(taskStore.selectedDate, { weekStartsOn: 1 });
                        statsStore.fetchWeekStats(uid, weekStart);
                },
                [uid, taskStore.selectedDate],
        );

	// ——— целевые высоты
	const expandedHeight = 300;
	const collapsedHeight = itemH || undefined;

	// Чтобы не дёргалось до первого измерения, не анимируем height, пока itemH=0
	const containerAnimate = itemH ? { height: isExpanded ? expandedHeight : collapsedHeight } : undefined;

	return (
		<motion.div
			initial={false}
			animate={containerAnimate}
			transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
			className={`${styles.stack} ${isExpanded ? styles.expanded : ""}`}
			style={{ overflow: "hidden" }} // важно для аккуратной анимации
		>
			{tasks.map((task, index) => {
				const offset = index * 11;
				const scale = 1 - index * 0.07;
				const z = tasks.length - index;

				return (
					<motion.div
						key={task ? task.id : `placeholder-${index}`}
						initial={false}
						animate={{
							y: isExpanded ? 0 : offset,
							scale: isExpanded ? 1 : scale,
							opacity: isExpanded || index === 0 ? 1 : 0.95,
						}}
						transition={{ type: "tween", duration: 0.4, ease: "easeOut" }}
						style={{
							position: isExpanded ? "relative" : "absolute",
							top: 0,
							left: 0,
							width: "100%",
							zIndex: isExpanded ? 0 : z,
							cursor: !isExpanded && index === 0 ? "pointer" : "default",
						}}
						onClick={() => {
							if (!isExpanded && index === 0 && canExpand) {
								handleToggle();
							}
						}}
						className={styles.taskItemWrapper}
					>
						<div
							className={styles.taskItemWrap}
							// измеряем первую карточку
							ref={index === 0 ? firstItemRef : undefined}
						>
							{task ? (
								<MainTaskItem
									task={task}
									isExpanded={isExpanded}
									onDelete={handleDelete}
									onComplete={handleComplete}
								/>
							) : (
								<EmptyTaskState>
									<span>Будущая</span>&nbsp; задача
								</EmptyTaskState>
							)}
						</div>
					</motion.div>
				);
			})}
		</motion.div>
	);
};
