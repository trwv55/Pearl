"use client";

import { Button } from "@/shared/ui/button";
import { useRouter } from "next/navigation";
import styles from "./auth.module.css";
import Image from "next/image";
import { ROUTES } from "@/shared/lib/routes";
import pearlLogo from "@/shared/assets/svg/pearl_logo.svg?url";
import { useWebHaptics } from "web-haptics/react";
import { HAPTIC_MEDIUM } from "@/shared/lib/haptics";

export const Auth = () => {
	const router = useRouter();
	const { trigger } = useWebHaptics();

	const handleRegister = () => {
		trigger(...HAPTIC_MEDIUM);
		router.push(ROUTES.AUTH_REGISTER);
	};

	const handleLogin = () => {
		trigger(...HAPTIC_MEDIUM);
		router.push(ROUTES.AUTH_LOGIN);
	};

	return (
		<div className="flex flex-col items-center justify-between flex-1 w-full">
			<div className={styles.top}>
				<div className={styles.title}>
					День начинается
					<br /> <span>с трёх важных дел</span>
				</div>
			</div>

			<div className="flex">
				<Image src={pearlLogo} alt="Pearl logo" width={210} height={45} />
			</div>

			<div className="w-full flex flex-col gap-2">
				<Button className="w-full" onClick={handleRegister} variant="start" size="start">
					Начать
				</Button>
				<button onClick={handleLogin} className={styles.hasAccount}>
					Уже есть аккаунт
				</button>
			</div>
		</div>
	);
};
