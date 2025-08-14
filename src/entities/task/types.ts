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
}

export type TaskMain = Omit<Task, "isMain"> & { isMain: true };
export type TaskRoutine = Omit<Task, "isMain"> & { isMain: false };

export const isTaskMain = (t: Task): t is TaskMain => t.isMain === true;
export const isTaskRoutine = (t: Task): t is TaskRoutine => t.isMain === false;
