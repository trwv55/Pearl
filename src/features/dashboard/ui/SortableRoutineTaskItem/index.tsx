import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/entities/task/types";
import { RoutineTaskItem } from "../RoutineTaskItem";

interface SortableRoutineTaskItemProps {
        task: Task;
        onDelete?: (taskId: string) => void;
}

export const SortableRoutineTaskItem: React.FC<SortableRoutineTaskItemProps> = ({ task, onDelete }) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: task.id,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

        return (
                <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
                        <RoutineTaskItem task={task} isDragging={isDragging} onDelete={onDelete} />
                </div>
        );
};
