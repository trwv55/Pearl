import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { startOfWeek, isSameDay } from "date-fns";
import { statsStore } from "@/entities/stats/store";
import { userStore } from "@/entities/user/store";
import { taskStore } from "@/entities/task/store";
import styles from "./WeeklyStats.module.css";
import { ProgressWheel } from "./ProgressWheel";

const emojiByTasks: Record<number, string> = {
	0: "😞",
	1: "😐",
	2: "😊",
	3: "🥳",
};

export const WeeklyStats = observer(() => {
	useEffect(() => {
		if (!userStore.user) return;
		const weekStart = startOfWeek(taskStore.selectedDate, { weekStartsOn: 1 });
		statsStore.fetchWeekStats(userStore.user.uid, weekStart);
	}, [userStore.user, taskStore.selectedDate]);

	const stats = statsStore.weekStats;
	if (!stats) return null;

	const currentDay = stats.days.find((d) => isSameDay(d.date, taskStore.selectedDate));
	if (!currentDay) return null;

	const dayCompleted = currentDay.completedMainTasksCount;
	const weekCompleted = stats.days.reduce((acc, d) => acc + d.completedMainTasksCount, 0);

	const emoji = emojiByTasks[dayCompleted] ?? "😐";

	return (
		<div className={styles.card}>
			<div className={styles.content}>
				<div className={styles.left}>
					<div className={styles.row}>
						<div className={styles.label}>Сегодня</div>
						<div className={styles.valuePrimary}>
							<span>{dayCompleted}</span>/3
						</div>
					</div>
					<div className={styles.row}>
						<div className={styles.label}>Эта неделя</div>
						<div className={styles.valueSecondary}>
							<span>{weekCompleted}</span>/21
						</div>
					</div>
				</div>

				<div className={styles.rings}>
					<ProgressWheel
						className={styles.outerRing}
						radius={88}
						strokeWidth={21}
						value={dayCompleted}
						total={3}
						trackColor="rgba(82, 97, 128, 0.18)"
						overshootDegrees={0}
						gradientStops={[
							{ offset: 0, color: "#AE96FF" },
							{ offset: 0.75, color: "#3D00CB" },
							{ offset: 1, color: "#AE96FF" },
						]}
					/>

					<ProgressWheel
						className={styles.innerRing}
						radius={62}
						strokeWidth={21}
						value={weekCompleted}
						total={21}
						trackColor="rgba(82, 97, 128, 0.16)"
						overshootDegrees={0}
						gradientStops={[
							{ offset: 0, color: "#2688EB" },
							{ offset: 0.75, color: "#96DAFF" },
							{ offset: 1, color: "#2688EB" },
						]}
					/>

					<div className={styles.emoji}>{emoji}</div>
				</div>
			</div>
		</div>
	);
});

export default WeeklyStats;
