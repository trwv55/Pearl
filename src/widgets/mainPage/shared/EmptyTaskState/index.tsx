import styles from "./EmptyTaskState.module.css";

export function EmptyTaskState() {
	return (
		<div className={styles.emptyWrap}>
			<div className={styles.emptyTitle}>
				<span>Отдыхаем!</span>&nbsp;Задач на сегодня нет
			</div>
		</div>
	);
}
