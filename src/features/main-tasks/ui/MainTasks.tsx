import styles from "@/features/main-tasks/TasksTop.module.css";
import { MainTasksCount } from "@/shared/ui/TasksCount";
import { observer } from "mobx-react-lite";
import { taskStore } from "@/shared/model/taskStore";
import { TasksAndStatsWidget } from "@/widgets/tasks-and-stats";
import { TaskViewPopupProvider } from "@/features/task-view";

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
