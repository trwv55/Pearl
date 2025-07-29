import { EmptyTaskState } from "../shared/EmptyTaskState";
import { Task } from "@/entities/task/api";

interface ShowRoutineTasksProps {
	tasks: Task[];
}

export const ShowRoutineTasks: React.FC<ShowRoutineTasksProps> = ({ tasks }) => {
	if (!tasks || tasks.length === 0) {
		return <EmptyTaskState />;
	}

	return <div>Список задач</div>;
};
