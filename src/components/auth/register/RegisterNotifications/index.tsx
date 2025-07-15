"use client";

import { Button } from "@/components/ui/button";
import { AuthBack } from "@/shared/assets/icons/AuthBack";
import { startBackText } from "@/features/auth/lib/classNames";
import { memo } from "react";
import { useRouter } from "next/navigation";
import styles from "./RegisterNotifications.module.css";

interface Props {
	onFinish: () => void;
	onPrev: () => void;
}

export const RegisterNotifications = memo(({ onFinish, onPrev }: Props) => {
	const router = useRouter();
	const handleEnableNotifications = async () => {
		try {
			if ("Notification" in window) {
				await Notification.requestPermission();
			}
		} catch (err) {
			console.warn("Не удалось запросить разрешение на уведомления", err);
		}
		onFinish();
	};

	return (
		<div className="h-full flex flex-col">
			<div className="flex justify-between">
				<Button variant="startBack" onClick={() => router.back()}>
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
