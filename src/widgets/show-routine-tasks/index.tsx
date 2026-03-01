import { EmptyTaskState } from "@/shared/ui/EmptyTaskState";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import type { Task } from "@/shared/types/task";
import { useCallback, useEffect, useState } from "react";
import { SortableRoutineTaskItem } from "@/features/routine-tasks";
import { userStore } from "@/shared/model/userStore";
import { taskStore } from "@/shared/model/taskStore";
import { toast } from "sonner";

interface ShowRoutineTasksProps {
	tasks: Task[];
}

interface DragEndEvent {
	active: { id: string | number };
	over: { id: string | number } | null;
}

export const ShowRoutineTasks: React.FC<ShowRoutineTasksProps> = ({ tasks }) => {
	const [taskOrder, setTaskOrder] = useState<Task[]>([]);
	const uid = userStore.user?.uid;

	useEffect(() => {
		setTaskOrder(tasks);
	}, [tasks]);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				delay: 1000,
				tolerance: 50,
			},
		}),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const oldIndex = taskOrder.findIndex(task => task.id === active.id);
		const newIndex = taskOrder.findIndex(task => task.id === over.id);
		setTaskOrder(arrayMove(taskOrder, oldIndex, newIndex));
	};

	const handleDelete = useCallback(
		(taskId: string) => {
			if (!uid) {
				toast.error("Нет данных пользователя");
				return;
			}
			const full = taskOrder.find(t => t.id === taskId);
			if (!full) return;
			taskStore.deleteWithUndo(uid, full);
		},
		[taskOrder, uid],
	);

	if (taskOrder.length === 0) {
		return (
			<EmptyTaskState>
				<span>Отдыхаем!</span>&nbsp;Задач на сегодня нет
			</EmptyTaskState>
		);
	}

	return (
		<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
			<SortableContext items={taskOrder.map(t => t.id)} strategy={verticalListSortingStrategy}>
				{taskOrder.map(task => (
					<SortableRoutineTaskItem key={task.id} task={task} onDelete={handleDelete} />
				))}
			</SortableContext>
		</DndContext>
	);
};
