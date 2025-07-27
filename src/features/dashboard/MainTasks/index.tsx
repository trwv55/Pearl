import { ShowMainTasks } from "@/widgets/mainPage/ShowMainTasks";
import styles from "../shared/styles/TasksTop.module.css";
import { MainTasksCount } from "@/widgets/mainPage/shared/tasksCount/MainTasksCount";

// interface DisplayMainTasksProps {

// }

export const MainTasks: React.FC = () => {
	return (
		<div className={styles.wrap}>
			<div className={styles.top}>
				<h2>Главные задачи</h2>
				<MainTasksCount current={0} max={3} />
			</div>
			<ShowMainTasks tasks={[]} showDots />
		</div>
	);
};
