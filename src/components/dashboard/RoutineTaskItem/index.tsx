import clsx from "clsx";
import type { Task } from "@/entities/task/types";
import { useCallback, useState } from "react";
import styles from "./RoutineTaskItem.module.css";
import { taskStore } from "@/entities/task/store";
import { toast } from "sonner";
import { userStore } from "@/entities/user/store";

interface RoutineTaskItemProps {
	task: Task;
	isDragging?: boolean;
	onDelete?: (taskId: string) => void;
}

export const RoutineTaskItem: React.FC<RoutineTaskItemProps> = ({ task, isDragging, onDelete }) => {
	const [isChecked, setIsChecked] = useState(task.isCompleted);
	const uid = userStore.user?.uid;

	const handleCheck = useCallback(
		async (e: { target: { checked: boolean | ((prevState: boolean) => boolean) } }) => {
			setIsChecked(e.target.checked);
			if (!uid) {
				toast.error("Нет данных пользователя");
				return;
			}
			await taskStore.toggleCompletion(uid, task.id);
		},
		[uid],
	);

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
