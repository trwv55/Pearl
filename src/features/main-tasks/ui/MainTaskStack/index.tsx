import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Task, TaskMain } from "@/shared/types/task";
import { MainTaskItem } from "@/features/main-tasks/ui/MainTaskItem";
import { EmptyTaskState } from "@/shared/ui/EmptyTaskState";
import styles from "./MainTaskStack.module.css";
import { userStore } from "@/shared/model/userStore";
import { taskStore } from "@/shared/model/taskStore";
import { toast } from "sonner";
import { statsStore } from "@/shared/model/statsStore";
import { startOfWeek } from "date-fns";
import { useWebHaptics } from "web-haptics/react";
import { HAPTIC_LIGHT } from "@/shared/lib/haptics";

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
	const isExpanded = isControlled ? controlledExpanded : uncontrolledExpanded;
	const prevTasksRef = useRef<string>("");
	const firstItemRef = useRef<HTMLDivElement | null>(null);
	const [itemH, setItemH] = useState<number>(0);
	const uid = userStore.user?.uid;
	const { trigger } = useWebHaptics();

	useEffect(() => {
		if (isControlled) return;
		const ids = tasks.map((t) => t?.id).join(",");
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

		const ro = new ResizeObserver(update);
		ro.observe(el);
		return () => ro.disconnect();
	}, [tasks]);

	const handleToggle = useCallback(() => {
		trigger(...HAPTIC_LIGHT);
		const next = !isExpanded;
		if (!isControlled) setUncontrolledExpanded(next);
		onExpandChange?.(next);
	}, [isExpanded, isControlled, onExpandChange, trigger]);

	const handleDelete = useCallback(
		(taskId: string) => {
			if (!uid) {
				toast.error("Нет данных пользователя");
				return;
			}
			const full = tasks.find((t) => t?.id === taskId);
			if (!full) return;
			onExpandChange?.(false);
			if (!isControlled) setUncontrolledExpanded(false);

			const weekStart = startOfWeek(taskStore.selectedDate, { weekStartsOn: 1 });
			taskStore.deleteWithUndo(uid, full, 4000, () => {
				statsStore.fetchWeekStats(uid, weekStart);
			});
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

	const expandedHeight = 300;
	const collapsedHeight = itemH || undefined;
	const containerAnimate = itemH ? { height: isExpanded ? expandedHeight : collapsedHeight } : undefined;

	return (
		<motion.div
			initial={false}
			animate={containerAnimate}
			transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
			className={`${styles.stack} ${isExpanded ? styles.expanded : ""}`}
			style={{ overflow: "hidden" }}
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
							if (!isExpanded && index === 0 && canExpand) handleToggle();
						}}
						className={styles.taskItemWrapper}
					>
						<div className={styles.taskItemWrap} ref={index === 0 ? firstItemRef : undefined}>
							{task ? (
								<MainTaskItem task={task} isExpanded={isExpanded} onDelete={handleDelete} onComplete={handleComplete} />
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
