import clsx from "clsx";
import type { Task } from "@/entities/task/types";
import { useState } from "react";
import styles from "./MainTaskItem.module.css";

interface RoutineTaskItemProps {
	task: Task;
	isDragging?: boolean;
	onDelete?: (taskId: string) => void;
}

export const MainTaskItem: React.FC<RoutineTaskItemProps> = ({ task, isDragging, onDelete }) => {
	const [isChecked, setIsChecked] = useState(false);

	return (
		<div
			className={clsx(styles.taskItem, {
				[styles.checked]: isChecked,
			})}
		>
			<div className={styles.taskItemContent}>
				<div className={styles.emojiWrap}>
					<div className={styles.emoji}>{task.emoji}</div>
				</div>
				<div className={styles.title}>{task.title}</div>
				<div className={styles.checkboxWrap}>
					<div className=""></div>
					<input type="checkbox" className={styles.checkbox} />
				</div>
			</div>
		</div>
	);
};
