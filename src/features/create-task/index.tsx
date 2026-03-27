"use client";
import { useState } from "react";
import styles from "./createTask.module.css";
import { TopBar } from "@/shared/ui/TopBar";
import { TaskForm } from "@/features/task-form";
import { MainPageLayout } from "@/app/layouts/MainPageLayout";
import { TaskGradientEllipse } from "@/shared/assets/icons/TaskGradientEllipse";
import { SettingsPopup } from "@/features/settings/ui/SettingsPopup";

export const CreateTask = () => {
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);

	return (
		<MainPageLayout>
			<div className="flex flex-col h-full overflow-y-hidden">
				<div className={styles.gradient}>
					<TaskGradientEllipse className={styles.gradientEllipse} color="#3d00cb" uniqueId="create-task" />
				</div>
				<div className={styles.topBarWrap}>
					<TopBar title="Создаем задачу" onLogoClick={() => setIsSettingsOpen(true)} />
				</div>
				<div className={styles.formWrap}>
					<TaskForm />
				</div>
			</div>
			<SettingsPopup isVisible={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
		</MainPageLayout>
	);
};
