import { ShowMainTasks } from "@/widgets/mainPage/ShowMainTasks";
import styles from "../shared/styles/TasksTop.module.css";
import { MainTasksCount } from "@/widgets/mainPage/shared/tasksCount/MainTasksCount";
import { observer } from "mobx-react-lite";
import { taskStore } from "@/entities/task/store";
import { dateStore } from "@/entities/date/store";

// interface DisplayMainTasksProps {

// }

export const MainTasks = observer(() => {
        const { mainTasks } = taskStore.getTasksGroupedByMain(dateStore.selectedDate);

        return (
                <div className={styles.wrap}>
                        <div className={styles.top}>
                                <h2>Главные задачи</h2>
                                <MainTasksCount current={mainTasks.length} max={3} />
                        </div>
                        <ShowMainTasks tasks={mainTasks} showDots />
                </div>
        );
});
