"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AppTopGradient } from "@/shared/assets/icons/AppTopGradient";
import styles from "./createTask.module.css";

export const CreateTask = () => {
	const router = useRouter();

	return (
		<div className="flex flex-col items-center justify-between h-full relative">
                        <div className={styles.gradient}>
                                <AppTopGradient className={styles.gradientSvg} />
                        </div>
			<h1>Create</h1>
		</div>
	);
};
