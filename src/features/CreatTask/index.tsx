"use client";
import styles from "./createTask.module.css";
import { TopBar } from "@/shared/ui/TopBar";
import TaskForm from "../TaskForm";
import { MainPageLayout } from "@/layouts/MainPageLayout";
import { taskStore } from "@/entities/task/store";
import { useEffect } from "react";

export const CreateTask = () => {
	useEffect(() => {
		console.log("Selected date:", taskStore.selectedDate);
	}, []);
	return (
		<MainPageLayout>
			<div className="flex flex-col h-full overflow-y-hidden">
				<div className={styles.gradient}></div>
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
