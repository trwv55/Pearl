"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AppTopGradient } from "@/shared/assets/icons/AppTopGradient";
import styles from "./createTask.module.css";
import { AuthBack } from "@/shared/assets/icons/AuthBack";
import { AppBack } from "@/shared/assets/icons/AppBack";
import { TopBar } from "@/shared/ui/TopBar";
import TaskForm from "../TaskForm";

export const CreateTask = () => {
	const router = useRouter();

	return (
		<div className="flex flex-col h-full overflow-y-hidden">
			<div className={styles.gradient}></div>
			<div className={styles.topBarWrap}>
				<TopBar title="Создаем задачу" />
			</div>
			<div className={styles.formWrap}>
				<TaskForm />
			</div>
		</div>
	);
};
