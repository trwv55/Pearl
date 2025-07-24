"use client";

import styles from "../tasksCount.module.css";

type RoutineTasksCountProps = {
	current: number;
	max: number;
};

export const RoutineTasksCount = ({ current, max }: RoutineTasksCountProps) => {
	return (
		<div className={styles.tasksWrap}>
			<span className={styles.tasksItem}>{current}</span>
			<span>/</span>
			<span className={styles.tasksItem}>{max}</span>
		</div>
	);
};
