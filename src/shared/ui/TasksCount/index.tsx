"use client";

import styles from "./TasksCount.module.css";

type TasksCountProps = {
	current: number;
	max: number;
};

export const MainTasksCount = ({ current, max }: TasksCountProps) => {
	return (
		<div className={styles.tasksWrap}>
			<span className={styles.tasksItem}>{current}</span>
			<span>/</span>
			<span className={styles.tasksItem}>{max}</span>
		</div>
	);
};

export const RoutineTasksCount = ({ current, max }: TasksCountProps) => {
	return (
		<div className={styles.tasksWrap}>
			<span className={styles.tasksItem}>{current}</span>
			<span>/</span>
			<span className={styles.tasksItem}>{max}</span>
		</div>
	);
};
