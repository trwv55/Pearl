"use client";
import styles from "./createTask.module.css";
import { TopBar } from "@/shared/ui/TopBar";
import TaskForm from "../TaskForm";
import { MainPageLayout } from "@/app/layouts/MainPageLayout";
import { taskStore } from "@/entities/task/store";
import { useEffect } from "react";
import { TaskGradientEllipse } from "@/shared/assets/icons/TaskGradientEllipse";

export const CreateTask = () => {
	return (
		<MainPageLayout>
			<div className="flex flex-col h-full overflow-y-hidden">
				<div className={styles.gradient}>
					<TaskGradientEllipse className={styles.gradientEllipse} color="#3d00cb" uniqueId="create-task" />
				</div>
				<div className={styles.topBarWrap}>
					<TopBar title="Создаем задачу" />
				</div>
				<div className={styles.formWrap}>
					<TaskForm />
				</div>
			</div>
		</MainPageLayout>
	);
};
