"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import GradientSVG from "@/shared/assets/svg/app-top.svg";
import gradient from "@/shared/assets/svg/app-top.svg";
import styles from "./createTask.module.css";
import Image from "next/image";

export const CreateTask = () => {
	const router = useRouter();

	return (
		<div className="flex flex-col items-center justify-between h-full relative">
			<div className={styles.gradient}>
				<GradientSVG className={styles.gradientSvg} />
			</div>
			<h1>Create</h1>
		</div>
	);
};
