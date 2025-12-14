import clsx from "clsx";
import type { Task } from "@/entities/task/types";
import { useCallback, useEffect, useState } from "react";
import styles from "./RoutineTaskItem.module.css";
import { taskStore } from "@/entities/task/store";
import { toast } from "sonner";
import { userStore } from "@/entities/user/store";
import { useSwipeable } from "react-swipeable";
import { statsStore } from "@/entities/stats/store";
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

	// свайпы
	const swipeHandlers = useSwipeable({
		onSwipedLeft: () => canSwipe && setShowDelete(true),
		onSwipedRight: () => canSwipe && setShowDelete(false),
		trackMouse: true, // удобно тестировать на десктопе
		delta: 25, // минимальная дистанция для распознавания свайпа
		preventScrollOnSwipe: true, // помогает не подёргивать скролл
	});

	// если начался dnd или свайпы запрещены — прячем delete
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
		// await viewTask(uid, task.id);
	}, [uid, task.id]);

	return (
		<div className={styles.swipeWrap} {...(canSwipe ? swipeHandlers : {})}>
			{/* Кнопка удаления — появляется при свайпе влево */}
			<button
				className={clsx(styles.deleteBtn, showDelete && styles.showDelete)}
				onClick={handleDeleteClick}
				aria-label="Удалить задачу"
				tabIndex={showDelete ? 0 : -1}
				// если нужно скрывать кнопку физически, когда свайпы отключены:
				style={{ display: canSwipe ? undefined : "none" }}
			>
				<img src="/svg/trash.svg" alt="Удалить" width={16} height={17} draggable={false} className={styles.trashIcon} />
			</button>

			<div
				className={clsx(styles.taskItem, {
					[styles.checked]: isChecked,
					[styles.dragging]: isDragging,
					[styles.swiped]: showDelete, // сдвиг контента влево при показе delete
				})}
				// эта директива снижает конфликты с жестами: вертикальный скролл остаётся системным
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
