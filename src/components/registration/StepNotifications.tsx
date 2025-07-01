"use client";

import { Button } from "@/components/ui/button";

interface Props {
	onFinish: () => void;
	goBack: () => void;
}

export const StepNotifications = ({ onFinish, goBack }: Props) => {
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

	const handleSkip = () => {
		onFinish();
	};

	return (
		<div className="flex flex-col h-full justify-between">
			<div className="flex justify-between">
				<Button onClick={goBack}>Назад</Button>
				<Button onClick={handleSkip}>Пропустить</Button>
			</div>
			<div className="text-center mt-16">
				<p className="text-sm text-muted-foreground">Шаг 5/5</p>
				<h2 className="text-2xl font-bold mt-4">Включи уведомления</h2>
				<div className="text-3xl mt-6">🔔</div>
				<p className="mt-2 text-sm text-muted-foreground">Чтобы точно ничего не забыть</p>
			</div>

			<div className="flex flex-col gap-2 mb-8 px-6">
				<Button onClick={handleEnableNotifications}>Готово</Button>
			</div>
		</div>
	);
};
