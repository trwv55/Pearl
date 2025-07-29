import { ShowRoutineTasks } from "@/widgets/mainPage/ShowRoutineTasks";
import styles from "../shared/styles/TasksTop.module.css";
import { RoutineTasksCount } from "@/widgets/mainPage/shared/tasksCount/RoutineTasksCount";
import { observer } from "mobx-react-lite";
import { taskStore } from "@/entities/task/store";
import { dateStore } from "@/entities/date/store";

export const RoutineTasks = observer(() => {
        const { otherTasks } = taskStore.getTasksGroupedByMain(dateStore.selectedDate);

        return (
                <div className={styles.wrap}>
                        <div className={styles.top}>
                                <h2>Задачи на день</h2>
                                <RoutineTasksCount current={otherTasks.length} max={otherTasks.length} />
                        </div>
                        <ShowRoutineTasks tasks={otherTasks} />
                </div>
        );
});
