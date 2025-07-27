import { EmptyTaskState } from "../shared/EmptyTaskState";

type Task = {
	id: string;
	title: string;
	done: boolean;
};

interface ShowRoutineTasksProps {
	tasks: Task[];
}

export const ShowRoutineTasks: React.FC<ShowRoutineTasksProps> = ({ tasks }) => {
	if (!tasks || tasks.length === 0) {
		return <EmptyTaskState />;
	}

	return <div>Список задач</div>;
};
