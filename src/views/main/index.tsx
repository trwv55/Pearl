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
import { userStore } from "@/shared/model/userStore";
import { useEffect, useState } from "react";
import { addDays, startOfDay } from "date-fns";
import { useSwipeable } from "react-swipeable";

export const MainPage = observer(() => {
	const [isStackExpanded, setIsStackExpanded] = useState(false);

	useEffect(() => {
		if (userStore.user) {
			const today = startOfDay(new Date());
			const start = addDays(today, -15);
			const end = addDays(today, 15);
			taskStore.fetchTasksForRange(userStore.user.uid, start, end);
		}
	}, [userStore.user]);

	useEffect(() => {
		setIsStackExpanded(false);
	}, [taskStore.selectedDate]);

	const handleDateChange = (date: Date) => {
		taskStore.setSelectedDate(date);
	};

	const stackSwipeHandlers = useSwipeable({
		onSwipedUp: () => setIsStackExpanded(false),
		delta: 50,
		preventScrollOnSwipe: false,
	});

	return (
		<ProtectedRoute>
			<MainPageLayout>
				<div className="relative">
					<div>
						<MainPageTopBar />
					</div>
					<div>
						<DaysSwitcher value={taskStore.selectedDate} onChange={handleDateChange} />
					</div>
					<div
						className="mt-[40px]"
						onClick={() => setIsStackExpanded(v => !v)}
						{...stackSwipeHandlers}
					>
						<MainTasks isStackExpanded={isStackExpanded} onExpandChange={setIsStackExpanded} />
					</div>
					<div className="mt-[40px]">
						<RoutineTasks />
					</div>
					<div className="flex flex-col justify-between items-center">
						<CreateTaskBtn />
					</div>
				</div>
			</MainPageLayout>
		</ProtectedRoute>
	);
});
