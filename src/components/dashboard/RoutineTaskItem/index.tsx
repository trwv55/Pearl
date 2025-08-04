import clsx from "clsx";
import type { Task } from "@/entities/task/types";
import { useState } from "react";
import styles from "./RoutineTaskItem.module.css";

interface RoutineTaskItemProps {
	task: Task;
	isDragging?: boolean;
	onDelete?: (taskId: string) => void;
}

export const RoutineTaskItem: React.FC<RoutineTaskItemProps> = ({ task, isDragging, onDelete }) => {
	const [isChecked, setIsChecked] = useState(false);

	const handleCheck = () => {
		setIsChecked(prev => !prev);
	};

	return (
		<div
			className={clsx(styles.taskItem, {
				[styles.checked]: isChecked,
				[styles.dragging]: isDragging,
			})}
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
	);
};
