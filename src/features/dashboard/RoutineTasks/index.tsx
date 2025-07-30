import { ShowRoutineTasks } from "@/widgets/mainPage/ShowRoutineTasks";
import styles from "../shared/styles/TasksTop.module.css";
import { RoutineTasksCount } from "@/widgets/mainPage/shared/tasksCount/RoutineTasksCount";
import { observer } from "mobx-react-lite";
import { taskStore } from "@/entities/task/store";

export const RoutineTasks: React.FC = observer(() => {
        return (
                <div className={styles.wrap}>
                        <div className={styles.top}>
                                <h2>Задачи на день</h2>
                                <RoutineTasksCount current={taskStore.routineTasks.length} max={0} />
                        </div>
                        <ShowRoutineTasks tasks={taskStore.routineTasks} />
                </div>
        );
});
