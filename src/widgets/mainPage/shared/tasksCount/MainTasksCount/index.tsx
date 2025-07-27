"use client";

import styles from "../tasksCount.module.css";

type MainTasksCountProps = {
	current: number;
	max: number;
};

export const MainTasksCount = ({ current, max }: MainTasksCountProps) => {
	return (
		<div className={styles.tasksWrap}>
			<span className={styles.tasksItem}>{current}</span>
			<span>/</span>
			<span className={styles.tasksItem}>{max}</span>
		</div>
	);
};
