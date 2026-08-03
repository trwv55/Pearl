"use client";

import DaysSwitcher from "@/widgets/day-switcher";
import { MainPageTopBar } from "@/widgets/main-page-top-bar";
import { CreateTaskBtn } from "@/shared/ui/CreateTaskBtn";
import { MainTasks } from "@/features/main-tasks";
import { RoutineTasks } from "@/features/routine-tasks";
import { MainPageLayout } from "@/app/layouts/MainPageLayout";
import { ProtectedRoute } from "@/app/providers/ProtectedRoute";
import { observer } from "mobx-react-lite";
import { taskStore } from "@/shared/model/taskStore";
import { statsStore } from "@/shared/model/statsStore";
import { taskRolloverStore } from "@/shared/model/taskRolloverStore";
import { userStore } from "@/shared/model/userStore";
import { useCallback, useEffect, useState } from "react";
import { addDays, startOfDay, startOfWeek, parseISO } from "date-fns";
import { usePullToRefresh } from "@/shared/hooks/usePullToRefresh";
import { RefreshRing } from "@/shared/ui/RefreshRing";
import { MainPageSkeleton } from "@/widgets/main-page-skeleton";

export const MainPage = observer(() => {
	const [isStackExpanded, setIsStackExpanded] = useState(false);
	// Скелетон на первой загрузке: только если данные выбранного дня ещё не в
	// кэше (после логина). При возврате на страницу с тёплым кэшем — не мигаем.
	const [initialLoading, setInitialLoading] = useState(() => !taskStore.isDateLoaded(taskStore.selectedDate));

	const handleRefresh = useCallback(async () => {
		if (!userStore.user) return;
		const uid = userStore.user.uid;
		const weekStart = startOfWeek(taskStore.selectedDate, { weekStartsOn: 1 });
		await Promise.all([
			taskStore.fetchTasks(uid, taskStore.selectedDate),
			statsStore.fetchWeekStats(uid, weekStart),
		]);
	}, []);

	const { pullDistance, isRefreshing, threshold } = usePullToRefresh(handleRefresh);

	useEffect(() => {
		if (!userStore.user) return;
		const uid = userStore.user.uid;
		const today = startOfDay(new Date());
		const start = addDays(today, -15);
		const end = addDays(today, 15);

		let cancelled = false;
		(async () => {
			// Автопродление: перед загрузкой переносим невыполненные главные
			// задачи с прошедших дней на сегодня (если тоггл включён).
			taskRolloverStore.initialize();
			if (taskRolloverStore.isEnabled && taskRolloverStore.enabledDate) {
				await taskStore.rolloverOverdueMainTasks(uid, parseISO(taskRolloverStore.enabledDate));
			}
			await taskStore.fetchTasksForRange(uid, start, end);
			if (!cancelled) setInitialLoading(false);
		})();
		return () => {
			cancelled = true;
		};
	}, [userStore.user]);

	// Догружаем день, если пользователь ушёл за пределы предзагруженного
	// диапазона — иначе он увидит пустой день при существующих задачах.
	useEffect(() => {
		if (userStore.user) {
			taskStore.ensureTasksForDate(userStore.user.uid, taskStore.selectedDate);
		}
	}, [userStore.user, taskStore.selectedDate]);

	useEffect(() => {
		setIsStackExpanded(false);
	}, [taskStore.selectedDate]);

	const handleDateChange = (date: Date) => {
		taskStore.setSelectedDate(date);
	};

	return (
		<ProtectedRoute>
			<MainPageLayout>
				{initialLoading ? (
					<MainPageSkeleton />
				) : (
				<>
				<RefreshRing pullDistance={pullDistance} isRefreshing={isRefreshing} threshold={threshold} />
				<div className="relative">
					<div>
						<MainPageTopBar />
					</div>
					<div>
						<DaysSwitcher value={taskStore.selectedDate} onChange={handleDateChange} />
					</div>
					<div className="mt-[40px]">
						<MainTasks isStackExpanded={isStackExpanded} onExpandChange={setIsStackExpanded} />
					</div>
					<div className="mt-[20px]">
						<RoutineTasks />
					</div>
					<div className="flex flex-col justify-between items-center">
						<CreateTaskBtn />
					</div>
				</div>
				</>
				)}
			</MainPageLayout>
		</ProtectedRoute>
	);
});
