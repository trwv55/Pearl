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
import { useCallback, useEffect, useRef, useState } from "react";
import { addDays, startOfDay, startOfWeek, parseISO, format, isSameDay } from "date-fns";
import { usePullToRefresh } from "@/shared/hooks/usePullToRefresh";
import { RefreshRing } from "@/shared/ui/RefreshRing";
import { MainPageSkeleton } from "@/widgets/main-page-skeleton";

export const MainPage = observer(() => {
	const [isStackExpanded, setIsStackExpanded] = useState(false);
	// Скелетон на первой загрузке: только если данные выбранного дня ещё не в
	// кэше (после логина). При возврате на страницу с тёплым кэшем — не мигаем.
	const [initialLoading, setInitialLoading] = useState(() => !taskStore.isDateLoaded(taskStore.selectedDate));
	// Ключ текущего календарного дня. При его смене (переход через полночь)
	// эффект подписки перецентрирует окно ±15 и заново запускает автопродление.
	const [todayKey, setTodayKey] = useState(() => format(startOfDay(new Date()), "yyyy-MM-dd"));
	const todayKeyRef = useRef(todayKey);
	useEffect(() => {
		todayKeyRef.current = todayKey;
	}, [todayKey]);

	const handleRefresh = useCallback(async () => {
		if (!userStore.user) return;
		const uid = userStore.user.uid;
		const weekStart = startOfWeek(taskStore.selectedDate, { weekStartsOn: 1 });
		await Promise.all([
			taskStore.fetchTasks(uid, taskStore.selectedDate),
			statsStore.fetchWeekStats(uid, weekStart),
		]);
	}, []);

	const { pullDistance, isRefreshing, isPulling, threshold } = usePullToRefresh(handleRefresh);

	useEffect(() => {
		if (!userStore.user) return;
		const uid = userStore.user.uid;
		const today = startOfDay(new Date());
		const start = addDays(today, -15);
		const end = addDays(today, 15);

		let cancelled = false;
		let unsubscribe: (() => void) | undefined;
		(async () => {
			// Автопродление: перед подпиской переносим невыполненные главные
			// задачи с прошедших дней на активный день (если тоггл включён).
			taskRolloverStore.initialize();
			if (taskRolloverStore.isEnabled && taskRolloverStore.enabledDate) {
				await taskStore.rolloverOverdueMainTasks(uid, parseISO(taskRolloverStore.enabledDate));
			}
			if (cancelled) return;
			// Живая подписка на окно ±15 дней: изменения приезжают сразу.
			unsubscribe = taskStore.subscribeToRange(uid, start, end, () => {
				if (!cancelled) setInitialLoading(false);
			});
		})();
		return () => {
			cancelled = true;
			unsubscribe?.();
		};
	}, [userStore.user, todayKey]);

	// Переход через полночь: при возврате из фона и раз в минуту проверяем смену
	// календарного дня. Если сменился — если пользователь был на «старом сегодня»,
	// переносим его на новый день, и обновляем todayKey (перецентровка окна).
	useEffect(() => {
		const check = () => {
			const nowKey = format(startOfDay(new Date()), "yyyy-MM-dd");
			if (nowKey === todayKeyRef.current) return;

			const prevToday = parseISO(todayKeyRef.current);
			if (isSameDay(taskStore.selectedDate, prevToday)) {
				taskStore.setSelectedDate(startOfDay(new Date()));
			}
			setTodayKey(nowKey);
		};

		const onVisibility = () => {
			if (!document.hidden) check();
		};
		document.addEventListener("visibilitychange", onVisibility);
		const interval = setInterval(check, 60_000);
		return () => {
			document.removeEventListener("visibilitychange", onVisibility);
			clearInterval(interval);
		};
	}, []);

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
				<div
					className="relative"
					style={{
						transform: `translateY(${pullDistance}px)`,
						transition: isPulling ? "none" : "transform 0.25s ease",
					}}
				>
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
				</div>
				{/* Вне трансформируемого блока: transform создаёт containing block
				    для position:fixed, иначе кнопка «отвязывается» от экрана. */}
				<CreateTaskBtn />
				</>
				)}
			</MainPageLayout>
		</ProtectedRoute>
	);
});
