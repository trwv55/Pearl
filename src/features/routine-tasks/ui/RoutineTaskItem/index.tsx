import clsx from "clsx";
import type { Task } from "@/shared/types/task";
import { useCallback, useEffect, useState } from "react";
import styles from "./RoutineTaskItem.module.css";
import { taskStore } from "@/shared/model/taskStore";
import { toast } from "sonner";
import { userStore } from "@/shared/model/userStore";
import { useSwipeable } from "react-swipeable";
import { statsStore } from "@/shared/model/statsStore";
import { startOfWeek } from "date-fns";

interface RoutineTaskItemProps {
	task: Task;
	isDragging?: boolean;
	onDelete?: (taskId: string) => void;
	canSwipe?: boolean;
}

export const RoutineTaskItem: React.FC<RoutineTaskItemProps> = ({ task, isDragging, onDelete, canSwipe = true }) => {
	const [isChecked, setIsChecked] = useState(task.isCompleted);
	const [showDelete, setShowDelete] = useState(false);
	const uid = userStore.user?.uid;

	useEffect(() => {
		setIsChecked(task.isCompleted);
	}, [task.isCompleted]);

	const swipeHandlers = useSwipeable({
		onSwipedLeft: () => canSwipe && setShowDelete(true),
		onSwipedRight: () => canSwipe && setShowDelete(false),
		trackMouse: true,
		delta: 25,
		preventScrollOnSwipe: true,
	});

	useEffect(() => {
		if (isDragging || !canSwipe) setShowDelete(false);
	}, [isDragging, canSwipe]);

	const handleCheck = useCallback(
		async (e: { target: { checked: boolean | ((prevState: boolean) => boolean) } }) => {
			setIsChecked(e.target.checked);
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

	const handleDeleteClick = () => {
		onDelete?.(task.id);
		setShowDelete(false);
	};

	const handleTaskClick = useCallback(async () => {
		if (!uid) return;
	}, [uid, task.id]);

	return (
		<div className={styles.swipeWrap} {...(canSwipe ? swipeHandlers : {})}>
			<button
				className={clsx(styles.deleteBtn, showDelete && styles.showDelete)}
				onClick={handleDeleteClick}
				aria-label="Удалить задачу"
				tabIndex={showDelete ? 0 : -1}
				style={{ display: canSwipe ? undefined : "none" }}
			>
				<img src="/svg/trash.svg" alt="Удалить" width={16} height={17} draggable={false} className={styles.trashIcon} />
			</button>

			<div
				className={clsx(styles.taskItem, {
					[styles.checked]: isChecked,
					[styles.dragging]: isDragging,
					[styles.swiped]: showDelete,
				})}
				style={{ touchAction: "pan-y", userSelect: "none", cursor: "pointer" }}
				onClick={handleTaskClick}
			>
				<div className={styles.taskItemContent}>
					<div className={styles.taskItemContentLeft}>
						<input type="checkbox" className={styles.checkbox} checked={isChecked} onChange={handleCheck} />
						<span className={styles.emoji}>{task.emoji}</span>
						<span className={styles.title}>{task.title}</span>
					</div>
					<div className={styles.marker} style={{ backgroundColor: task.markerColor }} />
				</div>
			</div>
		</div>
	);
};
