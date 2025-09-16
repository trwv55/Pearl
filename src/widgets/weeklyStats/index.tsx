import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { startOfWeek, format, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { statsStore } from '@/entities/stats/store';
import { userStore } from '@/entities/user/store';
import { taskStore } from '@/entities/task/store';
import styles from './WeeklyStats.module.css';
import { ProgressWheel } from './ProgressWheel';

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
        const weekCompleted = stats.days.reduce((acc, d) => acc + d.completedMainTasksCount, 0);

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
                                        <ProgressWheel
                                                className={styles.outerRing}
                                                radius={88}
                                                strokeWidth={16}
                                                value={dayCompleted}
                                                total={3}
                                                trackColor="rgba(82, 97, 128, 0.18)"
                                                gradientStops={[
                                                        { offset: 0, color: '#86D6FF' },
                                                        { offset: 0.5, color: '#4CB4FF' },
                                                        { offset: 0.5, color: '#1F7DFF' },
                                                        { offset: 1, color: '#86D6FF' },
                                                ]}
                                                endCapBorderColor="rgba(255, 255, 255, 0.85)"
                                        />

                                        <ProgressWheel
                                                className={styles.innerRing}
                                                radius={68}
                                                strokeWidth={12}
                                                value={weekCompleted}
                                                total={21}
                                                trackColor="rgba(82, 97, 128, 0.16)"
                                                gradientStops={[
                                                        { offset: 0, color: '#E1CCFF' },
                                                        { offset: 0.5, color: '#A26DFF' },
                                                        { offset: 0.5, color: '#623BFF' },
                                                        { offset: 1, color: '#E1CCFF' },
                                                ]}
                                                endCapBorderColor="rgba(255, 255, 255, 0.9)"
                                        />

                                        <div className={styles.emoji}>{emoji}</div>
                                </div>
			</div>
		</div>
	);
});
