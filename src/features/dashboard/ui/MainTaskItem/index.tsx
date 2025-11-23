import clsx from "clsx";
import { useSwipeable } from "react-swipeable";
import type { Task, TaskMain } from "@/entities/task/types";
import { useEffect, useState } from "react";
import { getTaskBackground } from "@/shared/lib/taskBackground";
import styles from "./MainTaskItem.module.css";

interface RoutineTaskItemProps {
	task: TaskMain;
	isDragging?: boolean;
	onDelete?: (taskId: string) => void;
	isExpanded?: boolean;
	onComplete?: (task: Task) => void;
}

const formatTime = (minutes: number) => {
	const h = Math.floor(minutes / 60)
		.toString()
		.padStart(2, "0");
	const m = (minutes % 60).toString().padStart(2, "0");
	return `${h}:${m}`;
};

export const MainTaskItem: React.FC<RoutineTaskItemProps> = ({ task, isExpanded, onDelete, onComplete }) => {
	const [isChecked, setIsChecked] = useState(task.isCompleted);
	const [showDelete, setShowDelete] = useState(false);

	// Синхронизируем чекбокс с бэкендом
	useEffect(() => {
		setIsChecked(task.isCompleted);
	}, [task.isCompleted]);

	// Показываем свайп только если стопка раскрыта
	const swipeHandlers = useSwipeable({
		onSwipedLeft: () => isExpanded && setShowDelete(true),
		onSwipedRight: () => isExpanded && setShowDelete(false),
		trackMouse: true, // Позволяет тестить свайп мышкой на десктопе
		delta: 25,
	});

	// Если стопка закрылась — скрываем delete
	if (!isExpanded && showDelete) {
		setShowDelete(false);
	}

	const handleDeleteClick = () => {
		onDelete?.(task.id);
		setShowDelete(false);
	};

	const handleChange = (e: { target: { checked: boolean | ((prevState: boolean) => boolean) } }) => {
		setIsChecked(e.target.checked);
		onComplete?.(task);
	};

	return (
		<div className={styles.swipeWrap} {...(isExpanded ? swipeHandlers : {})}>
			<button
				className={clsx(styles.deleteBtn, showDelete && styles.showDelete)}
				onClick={handleDeleteClick}
				aria-label="Удалить задачу"
				tabIndex={showDelete ? 0 : -1}
				style={{ display: isExpanded ? undefined : "none" }}
			>
				<img src="/svg/trash.svg" alt="Удалить" width={32} height={32} draggable={false} className={styles.trashIcon} />
			</button>
			<div
				className={clsx(styles.taskItem, {
					[styles.checked]: isChecked,
					[styles.swiped]: showDelete,
				})}
				style={{
					background: getTaskBackground(task.markerColor),
				}}
			>
				<div className={styles.taskItemContent}>
					<div className={styles.emojiWrap}>
						<div className={styles.emoji}>{task.emoji}</div>
					</div>
					<div className={styles.title}>{task.title}</div>
					<div className={styles.right}>
						{task.time !== null && <div className={styles.time}>{formatTime(task.time)}</div>}
						<div className={styles.checkboxWrap}>
							<input
								type="checkbox"
								className={styles.checkbox}
								checked={isChecked}
								// onChange={e => setIsChecked(e.target.checked)}
								onChange={handleChange}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
