import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { startOfWeek, format, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { statsStore } from '@/entities/stats/store';
import { userStore } from '@/entities/user/store';
import { taskStore } from '@/entities/task/store';
import styles from './WeeklyStats.module.css';
import { RadialRing } from './RadialRing';

const emojiByTasks: Record<number, string> = {
	0: '😞',
	1: '😐',
	2: '😊',
	3: '🥳',
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
	const dayProgress = dayCompleted / 3;

	const weekCompleted = stats.days.reduce((acc, d) => acc + d.completedMainTasksCount, 0);
	const weekProgress = Math.min(1, weekCompleted / 21);

	const emoji = emojiByTasks[dayCompleted] ?? '😐';

	return (
		<div className={styles.card}>
			<div className={styles.content}>
				<div className={styles.left}>
					<div className={styles.row}>
						<span className={styles.label}>Сегодня</span>
						<span className={styles.valuePrimary}>{dayCompleted}/3</span>
					</div>
					<div className={styles.row}>
						<span className={styles.label}>Эта неделя</span>
						<span className={styles.valueSecondary}>{weekCompleted}/21</span>
					</div>
				</div>

				<div className={styles.rings}>
					{/* Внешнее кольцо — «сегодня» */}
					<RadialRing
						value={dayProgress}
						size={176}
						stroke={14}
						startAngle={-80}
						gradientStops={[
							{ offset: '0%', color: '#5E2EF4' },
							{ offset: '100%', color: '#7D5CFF' },
						]}
						trackColor="rgba(0,0,0,0.12)"
					/>

					{/* Внутреннее кольцо — «неделя» */}
					<div className={styles.innerRing}>
						<RadialRing
							value={weekProgress}
							size={136}
							stroke={14}
							startAngle={-90}
							gradientStops={[
								{ offset: '0%', color: '#5FC6FF' },
								{ offset: '100%', color: '#4AA8FF' },
							]}
							trackColor="rgba(0,0,0,0.08)"
						/>
					</div>

					<div className={styles.emoji}>{emoji}</div>
				</div>
			</div>
		</div>
	);
});
