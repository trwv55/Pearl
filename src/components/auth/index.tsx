"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import styles from "./StepIntro.module.css";
import Image from "next/image";

interface AuthProps {
	onNext: () => void;
}

export const Auth = ({ onNext }: AuthProps) => {
	const router = useRouter();

	return (
		<div className="flex flex-col items-center justify-between h-full">
			<div className={styles.top}>
				<div className={styles.title}>
					День начинается
					<br /> <span>с трёх важных дел</span>
				</div>
			</div>

			<div className="flex">
				<Image src="/pearl-logo.svg" alt="Pearl logo" width={54} height={40} /> <h1 className={styles.name}>Pearl</h1>
			</div>

			<div className="w-full flex flex-col gap-2">
				<Button className="w-full" onClick={onNext} variant="start" size="start">
					Начать
				</Button>
				<button onClick={() => router.push("/login")} className={styles.hasAccount}>
					Уже есть аккаунт
				</button>
			</div>
		</div>
	);
};
