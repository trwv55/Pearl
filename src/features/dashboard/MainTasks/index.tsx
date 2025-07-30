import { ShowMainTasks } from "@/widgets/mainPage/ShowMainTasks";
import styles from "../shared/styles/TasksTop.module.css";
import { MainTasksCount } from "@/widgets/mainPage/shared/tasksCount/MainTasksCount";
import { observer } from "mobx-react-lite";
import { taskStore } from "@/entities/task/store";

// interface DisplayMainTasksProps {

// }

export const MainTasks: React.FC = observer(() => {
        return (
                <div className={styles.wrap}>
                        <div className={styles.top}>
                                <h2>Главные задачи</h2>
                                <MainTasksCount current={taskStore.mainTasks.length} max={3} />
                        </div>
                        <ShowMainTasks tasks={taskStore.mainTasks} showDots />
                </div>
        );
});
