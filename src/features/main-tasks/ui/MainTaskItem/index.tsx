import clsx from "clsx";
import { useSwipeable } from "react-swipeable";
import type { Task, TaskMain } from "@/shared/types/task";
import { useCallback, useEffect, useState } from "react";
import { getTaskBackground } from "@/shared/lib/taskBackground";
import styles from "./MainTaskItem.module.css";
import { useTaskViewPopup } from "@/features/task-view";
import { formatTimeFromMinutes } from "@/shared/lib/utils";
import { useWebHaptics } from "web-haptics/react";
import { HAPTIC_SUCCESS } from "@/shared/lib/haptics";

interface RoutineTaskItemProps {
	task: TaskMain;
	isDragging?: boolean;
	onDelete?: (taskId: string) => void;
	isExpanded?: boolean;
	onComplete?: (task: Task) => void;
}

export const MainTaskItem: React.FC<RoutineTaskItemProps> = ({ task, isExpanded, onDelete, onComplete }) => {
	const [isChecked, setIsChecked] = useState(task.isCompleted);
	const [showDelete, setShowDelete] = useState(false);
	const { openTask } = useTaskViewPopup();
	const { trigger } = useWebHaptics();

	useEffect(() => {
		setIsChecked(task.isCompleted);
	}, [task.isCompleted]);

	const swipeHandlers = useSwipeable({
		onSwipedLeft: () => isExpanded && setShowDelete(true),
		onSwipedRight: () => isExpanded && setShowDelete(false),
		trackMouse: true,
		delta: 25,
	});

	if (!isExpanded && showDelete) {
		setShowDelete(false);
	}

	const handleDeleteClick = () => {
		onDelete?.(task.id);
		setShowDelete(false);
	};

	const handleChange = (e: { target: { checked: boolean | ((prevState: boolean) => boolean) } }) => {
		setIsChecked(e.target.checked);
		if (e.target.checked) trigger(HAPTIC_SUCCESS);
		onComplete?.(task);
	};

	const handleOpen = useCallback(() => {
		if (isExpanded) openTask(task);
	}, [openTask, task, isExpanded]);

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
				className={clsx(styles.taskItem, { [styles.checked]: isChecked, [styles.swiped]: showDelete })}
				style={{ background: getTaskBackground(task.markerColor, isChecked) }}
				onClick={handleOpen}
			>
				<div className={styles.taskItemContent}>
					<div className={styles.emojiWrap}>
						<div className={styles.emoji}>{task.emoji}</div>
					</div>
					<div className={styles.title}>{task.title}</div>
					<div className={styles.right}>
						{task.time !== null && <div className={styles.time}>{formatTimeFromMinutes(task.time)}</div>}
						<div className={styles.checkboxWrap}>
							<input
								type="checkbox"
								className={styles.checkbox}
								checked={isChecked}
								onChange={handleChange}
								onClick={(event) => event.stopPropagation()}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
