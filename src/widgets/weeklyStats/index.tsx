import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { startOfWeek, format, isSameDay } from "date-fns";
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

        const currentDay = stats.days.find(day => isSameDay(day.date, taskStore.selectedDate));
        if (!currentDay) return null;

        return (
                <div>
                        <div>
                                {format(currentDay.date, "EEEE", { locale: ru })}: {currentDay.completedMainTasksCount}/3{" "}
                                {currentDay.isCompleted ? "✅" : "❌"}
                        </div>
                        <div>completed: {stats.completedDaysCount}</div>
                </div>
        );
});
