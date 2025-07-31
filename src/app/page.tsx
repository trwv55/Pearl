"use client";

import DaysSwitcher from "@/widgets/mainPage/DaySwitcher";
import { MainPageTopBar } from "@/widgets/mainPage/MainPageTopBar";
import { CreateTaskBtn } from "@/widgets/mainPage/shared/CreateTaskBtn";
import { SwitcherModeBtn } from "@/widgets/mainPage/shared/SwitcherModeBtn";
import { MainTasks } from "@/features/dashboard/MainTasks";
import { RoutineTasks } from "@/features/dashboard/RoutineTasks";
import { MainPageLayout } from "@/layouts/MainPageLayout";
import { ProtectedRoute } from "@/providers/ProtectedRoute";
import { observer } from "mobx-react-lite";
import { logout } from "@/lib/auth/logout";
import { taskStore } from "@/entities/task/store";
import { userStore } from "@/entities/user/store";
import { useEffect } from "react";
import { addDays, startOfDay } from "date-fns";

const Home = observer(() => {
	const handleLogout = () => {
		logout();
	};

	useEffect(() => {
		if (userStore.user) {
			const today = startOfDay(new Date());
			const start = addDays(today, -15);
			const end = addDays(today, 15);

			taskStore.fetchTasksForRange(userStore.user.uid, start, end); // загрузить диапазон
		}
	}, [userStore.user]);

	const handleDateChange = (date: Date) => {
		taskStore.setSelectedDate(date);
	};

	return (
		<ProtectedRoute>
			<MainPageLayout>
				<div className="relative">
					<div className="">
						<MainPageTopBar />
					</div>
					<div className="">
						<DaysSwitcher value={taskStore.selectedDate} onChange={handleDateChange} />
					</div>
					<div className="mt-[40px]">
						<MainTasks />
					</div>
					<div className="mt-[40px]">
						<RoutineTasks />
					</div>
					<div className="flex flex-col justify-between items-center">
						<CreateTaskBtn />
						<SwitcherModeBtn />
						<button onClick={handleLogout}>Logout</button>
					</div>
				</div>
			</MainPageLayout>
		</ProtectedRoute>
	);
});

export default Home;
