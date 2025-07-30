import { ShowRoutineTasks } from "@/widgets/mainPage/ShowRoutineTasks";
import styles from "../shared/styles/TasksTop.module.css";
import { RoutineTasksCount } from "@/widgets/mainPage/shared/tasksCount/RoutineTasksCount";
import { observer } from "mobx-react-lite";
import { taskStore } from "@/entities/task/store";

export const RoutineTasks: React.FC = observer(() => {
        const tasks = taskStore.routineTasks;
        return (
                <div className={styles.wrap}>
                        <div className={styles.top}>
                                <h2>Задачи на день</h2>
                                <RoutineTasksCount current={tasks.length} max={0} />
                        </div>
                        <ShowRoutineTasks tasks={tasks.map(t => ({ id: t.id, title: t.title, done: t.isCompleted }))} />
                </div>
        );
});
