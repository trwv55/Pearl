import { ShowRoutineTasks } from "@/components/mainPage/ShowRoutineTasks";
import styles from "../shared/styles/TasksTop.module.css";
import { RoutineTasksCount } from "@/components/mainPage/shared/tasksCount/RoutineTasksCount";

export const RoutineTasks: React.FC = () => {
	return (
		<div className={styles.wrap}>
			<div className={styles.top}>
				<h2>Задачи на день</h2>
				<RoutineTasksCount current={0} max={0} />
			</div>
			<ShowRoutineTasks tasks={[]} />
		</div>
	);
};
