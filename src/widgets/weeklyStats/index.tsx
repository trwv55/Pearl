import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { startOfWeek, format } from "date-fns";
import { ru } from "date-fns/locale";
import { statsStore } from "@/entities/stats/store";
import { userStore } from "@/entities/user/store";
import { taskStore } from "@/entities/task/store";

export const WeeklyStats = observer(() => {
	useEffect(() => {
		if (!userStore.user) return;
		const weekStart = startOfWeek(taskStore.selectedDate, { weekStartsOn: 1 });
		statsStore.fetchWeekStats(userStore.user.uid, weekStart);
	}, [userStore.user, taskStore.selectedDate]);

	const stats = statsStore.weekStats;
	if (!stats) return null;

	return (
		<div>
			<ul>
				{stats.days.map(day => (
					<li key={day.date.toDateString()}>
						{format(day.date, "EEEE", { locale: ru })}: {day.isCompleted ? "✅" : "❌"}
					</li>
				))}
			</ul>
			<div>completed: {stats.completedDaysCount}</div>
		</div>
	);
});
