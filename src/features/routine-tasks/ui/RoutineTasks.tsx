import { ShowRoutineTasks } from "@/widgets/show-routine-tasks";
import styles from "@/features/main-tasks/TasksTop.module.css";
import { RoutineTasksCount } from "@/shared/ui/TasksCount";
import { observer } from "mobx-react-lite";
import { taskStore } from "@/shared/model/taskStore";

export const RoutineTasks: React.FC = observer(() => {
	const routineTasks = taskStore.routineTasks;
	const completedCount = routineTasks.filter(task => task.isCompleted).length;
	const totalCount = routineTasks.length;

	return (
		<div className={styles.wrap}>
			<div className={styles.top}>
				<h2>Задачи на день</h2>
				<RoutineTasksCount current={completedCount} max={totalCount} />
			</div>
			<ShowRoutineTasks tasks={taskStore.routineTasks} />
		</div>
	);
});
