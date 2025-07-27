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

const Home = observer(() => {
	return (
		<ProtectedRoute>
			<MainPageLayout>
				<div className="relative">
					<div className="">
						<MainPageTopBar />
					</div>
					<div className="">
						<DaysSwitcher />
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
					</div>
				</div>
			</MainPageLayout>
		</ProtectedRoute>
	);
});

export default Home;
