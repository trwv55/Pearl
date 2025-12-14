import styles from "../shared/styles/TasksTop.module.css";
import { MainTasksCount } from "@/widgets/mainPage/shared/tasksCount/MainTasksCount";
import { observer } from "mobx-react-lite";
import { taskStore } from "@/entities/task/store";
import { TasksAndStatsWidget } from "@/widgets/mainPage/TasksAndStatsWidget";
import { TaskViewPopupProvider } from "@/features/dashboard/hooks/useTaskViewPopup";

export const MainTasks: React.FC = observer(() => {
	return (
		<div className={styles.wrap}>
			<div className={styles.top}>
				<h2>Главные задачи</h2>
				<MainTasksCount current={taskStore.mainTasks.length} max={3} />
			</div>
			<TaskViewPopupProvider>
				<TasksAndStatsWidget tasks={taskStore.mainTasks} showDots />
			</TaskViewPopupProvider>
		</div>
	);
});
