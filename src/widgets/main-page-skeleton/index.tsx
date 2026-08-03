import styles from "./MainPageSkeleton.module.css";

// Скелетон главной страницы: показывается после входа/логина, пока грузятся
// первые данные. Повторяет структуру главной — приветствие, свитчер дней,
// блок главных задач, карусель, блок задач на день, кнопку создания.
export const MainPageSkeleton = () => {
	return (
		<div className={styles.root} aria-hidden>
			{/* Приветствие + логотип */}
			<div className={styles.header}>
				<div className={styles.greeting}>
					<div className={`${styles.sk} ${styles.greetLine1}`} />
					<div className={`${styles.sk} ${styles.greetLine2}`} />
				</div>
				<div className={`${styles.sk} ${styles.logo}`} />
			</div>

			{/* Свитчер дней */}
			<div className={styles.days}>
				<div className={styles.month}>
					<div className={`${styles.sk} ${styles.monthLine}`} />
					<div className={`${styles.sk} ${styles.monthLine}`} />
				</div>
				<div className={styles.divider} />
				<div className={`${styles.sk} ${styles.day}`} />
				<div className={`${styles.sk} ${styles.day}`} />
				<div className={`${styles.sk} ${styles.day}`} />
				<div className={`${styles.sk} ${styles.day}`} />
			</div>

			{/* Главные задачи */}
			<div className={styles.sectionHead}>
				<div className={`${styles.sk} ${styles.label}`} />
				<div className={`${styles.sk} ${styles.pill}`} />
			</div>
			<div className={`${styles.sk} ${styles.card}`} />

			{/* Точки карусели */}
			<div className={styles.dots}>
				<div className={`${styles.sk} ${styles.dot}`} />
				<div className={`${styles.sk} ${styles.dot}`} />
			</div>

			{/* Задачи на день */}
			<div className={styles.sectionHead}>
				<div className={`${styles.sk} ${styles.label}`} />
				<div className={`${styles.sk} ${styles.pill}`} />
			</div>
			<div className={`${styles.sk} ${styles.card}`} />

			{/* Кнопка создания */}
			<div className={`${styles.sk} ${styles.fab}`} />
		</div>
	);
};
