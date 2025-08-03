import { ShowRoutineTasks } from "@/widgets/mainPage/ShowRoutineTasks";
import styles from "../shared/styles/TasksTop.module.css";
import { RoutineTasksCount } from "@/widgets/mainPage/shared/tasksCount/RoutineTasksCount";
import { observer } from "mobx-react-lite";
import { taskStore } from "@/entities/task/store";

export const RoutineTasks: React.FC = observer(() => {
	const routineTasks = taskStore.routineTasks;
	const completedCount = routineTasks.filter(task => task.isCompleted).length;
	const totalCount = routineTasks.length;

	return (
		<div className={styles.wrap}>
			<div className={styles.top}>
				<h2>Задачи на день</h2>
				<RoutineTasksCount current={0} max={totalCount} />
			</div>
			<ShowRoutineTasks tasks={taskStore.routineTasks} />
		</div>
	);
});
