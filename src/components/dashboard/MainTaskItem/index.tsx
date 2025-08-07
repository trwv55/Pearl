import clsx from "clsx";
import { useSwipeable } from "react-swipeable";
import type { Task } from "@/entities/task/types";
import { useState } from "react";
import styles from "./MainTaskItem.module.css";

interface RoutineTaskItemProps {
	task: Task;
	isDragging?: boolean;
	onDelete?: (taskId: string) => void;
	isExpanded?: boolean;
}

export const MainTaskItem: React.FC<RoutineTaskItemProps> = ({ task, isExpanded, onDelete }) => {
	const [isChecked, setIsChecked] = useState(false);
	const [showDelete, setShowDelete] = useState(false);

	// Показываем свайп только если стопка раскрыта
	const swipeHandlers = useSwipeable({
		onSwipedLeft: () => isExpanded && setShowDelete(true),
		onSwipedRight: () => isExpanded && setShowDelete(false),
		// preventDefaultTouchmoveEvent: true,
		trackMouse: true, // Позволяет тестить свайп мышкой на десктопе
	});

	// Если стопка закрылась — скрываем delete
	if (!isExpanded && showDelete) {
		setShowDelete(false);
	}

	return (
		<div className={styles.swipeWrap} {...(isExpanded ? swipeHandlers : {})}>
			<button
				className={clsx(styles.deleteBtn, showDelete && styles.showDelete)}
				onClick={() => onDelete?.(task.id)}
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
			>
				<div className={styles.taskItemContent}>
					<div className={styles.emojiWrap}>
						<div className={styles.emoji}>{task.emoji}</div>
					</div>
					<div className={styles.title}>{task.title}</div>
					<div className={styles.right}>
						<div className={styles.time}>15:00-16:00</div>
						<div className={styles.checkboxWrap}>
							<input
								type="checkbox"
								className={styles.checkbox}
								checked={isChecked}
								onChange={e => setIsChecked(e.target.checked)}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
