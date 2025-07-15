"use client";
import styles from "./createTask.module.css";
import { TopBar } from "@/shared/ui/TopBar";
import TaskForm from "../TaskForm";

export const CreateTask = () => {
	return (
		<div className="w-full h-full pt-[60px] pr-[20px] pb-[40px] pl-[20px] bg-[var(--app-bg)]">
			<div className="flex flex-col h-full overflow-y-hidden">
				<div className={styles.gradient}></div>
				<div className={styles.topBarWrap}>
					<TopBar title="Создаем задачу" />
				</div>
				<div className={styles.formWrap}>
					<TaskForm />
				</div>
			</div>
		</div>
	);
};
