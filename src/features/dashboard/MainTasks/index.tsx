import { ShowMainTasks } from "@/widgets/mainPage/ShowMainTasks";
import styles from "../shared/styles/TasksTop.module.css";
import { MainTasksCount } from "@/widgets/mainPage/shared/tasksCount/MainTasksCount";
import { observer } from "mobx-react-lite";
import { taskStore } from "@/entities/task/store";

// interface DisplayMainTasksProps {

// }

export const MainTasks: React.FC = observer(() => {
        const tasks = taskStore.mainTasks;
        return (
                <div className={styles.wrap}>
                        <div className={styles.top}>
                                <h2>Главные задачи</h2>
                                <MainTasksCount current={tasks.length} max={3} />
                        </div>
                        <ShowMainTasks tasks={tasks.map(t => ({ id: t.id, title: t.title, done: t.isCompleted }))} showDots />
                </div>
        );
});
