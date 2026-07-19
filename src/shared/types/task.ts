export interface Task {
	id: string;
	title: string;
	comment: string;
	date: Date;
	emoji: string;
	isMain: boolean;
	markerColor: string;
	isCompleted: boolean;
	completedAt: Date | null;
	time: number | null;
	// Позиция в списке своего типа внутри дня (drag-and-drop).
	// У старых задач может отсутствовать — тогда используется фолбэк по createdAt.
	order: number;
	// Для фолбэк-сортировки задач без order.
	createdAt: Date | null;
}

export type TaskMain = Omit<Task, "isMain"> & { isMain: true };
export type TaskRoutine = Omit<Task, "isMain"> & { isMain: false };

export const isTaskMain = (t: Task): t is TaskMain => t.isMain === true;
export const isTaskRoutine = (t: Task): t is TaskRoutine => t.isMain === false;

// Сентинел для задач без явного order (старые данные) — уходят в конец списка.
export const NO_ORDER = Number.MAX_SAFE_INTEGER;

// Компаратор порядка задач: сначала по order, при равенстве — по createdAt (старые раньше).
export const compareTaskOrder = (a: Task, b: Task): number => {
	if (a.order !== b.order) return a.order - b.order;
	const at = a.createdAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
	const bt = b.createdAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
	return at - bt;
};
