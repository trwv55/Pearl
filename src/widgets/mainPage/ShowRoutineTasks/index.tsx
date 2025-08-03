import { RoutineTaskItem } from "@/components/dashboard/RoutineTaskItem";
import { EmptyTaskState } from "../shared/EmptyTaskState";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import type { Task } from "@/entities/task/types";
import { useEffect, useState } from "react";
import { SortableRoutineTaskItem } from "@/components/dashboard/SortableRoutineTaskItem";

interface ShowRoutineTasksProps {
	tasks: Task[];
}

interface DragEndEvent {
	active: { id: string | number };
	over: { id: string | number } | null;
}

export const ShowRoutineTasks: React.FC<ShowRoutineTasksProps> = ({ tasks }) => {
	const [taskOrder, setTaskOrder] = useState<Task[]>([]);

	useEffect(() => {
		setTaskOrder(tasks);
	}, [tasks]);

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const oldIndex = taskOrder.findIndex(task => task.id === active.id);
		const newIndex = taskOrder.findIndex(task => task.id === over.id);

		setTaskOrder(arrayMove(taskOrder, oldIndex, newIndex));
	};

	if (taskOrder.length === 0) {
		return <EmptyTaskState />;
	}

	return (
		<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
			<SortableContext items={taskOrder.map(t => t.id)} strategy={verticalListSortingStrategy}>
				{taskOrder.map(task => (
					<SortableRoutineTaskItem key={task.id} task={task} />
				))}
			</SortableContext>
		</DndContext>
	);
};
