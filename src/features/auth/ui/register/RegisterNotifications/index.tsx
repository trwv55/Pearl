"use client";

import { Button } from "@/shared/ui/button";
import { AuthBack } from "@/shared/assets/icons/AuthBack";
import { startBackText } from "@/features/auth/lib/classNames";
import { memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./RegisterNotifications.module.css";
import { ROUTES } from "@/shared/lib/routes";
import { useWebHaptics } from "web-haptics/react";
import { HAPTIC_LIGHT } from "@/shared/lib/haptics";

interface Props {
	onFinish: () => void;
	onPrev: () => void;
}

export const RegisterNotifications = memo(({ onFinish, onPrev }: Props) => {
	const router = useRouter();
	const { trigger } = useWebHaptics();

	const handleEnableNotifications = async () => {
		trigger(...HAPTIC_LIGHT);
		try {
			if ("Notification" in window) {
				await Notification.requestPermission();
			}
		} catch (err) {
			console.warn("Не удалось запросить разрешение на уведомления", err);
		}
		onFinish();
	};

	const handleBack = useCallback(() => {
		trigger(...HAPTIC_LIGHT);
		if (typeof window !== "undefined" && window.history.length > 1) {
			router.back();
		} else {
			router.push(ROUTES.HOME);
		}
	}, [router, trigger]);

	return (
		<div className="h-full flex flex-col">
			<div className="flex justify-between">
				<Button variant="startBack" onClick={handleBack}>
					<AuthBack className="w-[6px] h-[10px]" />
					Назад
				</Button>
			</div>
			<div className={`${startBackText} mt-[40px]`}>Шаг 5/5</div>
			<div className="flex flex-col items-center gap-6 text-white mt-16">
				<h2 className={styles.title}>Включи уведомления</h2>
				<div className="text-[32px]">🔔</div>
				<p className={styles.text}>Чтобы точно ничего не забыть</p>
			</div>
			<div className="mt-auto">
				<Button variant="start" size="start" onClick={handleEnableNotifications}>
					Готово
				</Button>
			</div>
		</div>
	);
});

RegisterNotifications.displayName = "RegisterNotifications";
