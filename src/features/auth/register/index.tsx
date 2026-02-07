"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "../layout/AuthLayout";
import { RegisterEmail } from "@/features/auth/ui/register/RegisterEmail";
import { RegisterPassword } from "@/features/auth/ui/register/RegisterPassword";
import { RegisterConfirmPassword } from "@/features/auth/ui/register/RegisterConfirmPassword";
import { RegisterName } from "@/features/auth/ui/register/RegisterName";
import { registerUser } from "@/shared/lib/auth/register";
import { toast } from "sonner";
import { userStore } from "@/entities/user/store";
import SplashScreen from "@/shared/ui/TopBar/SplashScreen";
import { getFirebaseAuth } from "@/shared/lib/firebase";
import { RegisterNotifications } from "../ui/register/RegisterNotifications";
import { ROUTES } from "@/shared/lib/routes";

export const Register = () => {
	const [step, setStep] = useState(0);
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		confirmPassword: "",
		name: "",
	});
	const [showSplash, setShowSplash] = useState(false);
	const router = useRouter();

	const goNext = useCallback(() => setStep((prev) => prev + 1), []);
	const goBack = useCallback(() => setStep((prev) => Math.max(0, prev - 1)), []);

	const handleFinish = useCallback(async () => {
		if (formData.password !== formData.confirmPassword) {
			toast.error("Пароли не совпадают");
			setStep(2);
			return;
		}

		try {
			const user = await registerUser(formData.email, formData.password, formData.name);
			userStore.setUser(user);

			if (typeof window !== "undefined" && !localStorage.getItem("splashShown")) {
				setShowSplash(true);
				localStorage.setItem("splashShown", "true");
				setTimeout(() => router.push(ROUTES.HOME), 2000);
			} else {
				router.push(ROUTES.HOME);
			}
		} catch (err: unknown) {
			console.error("Register error:", err);
			const error = err as { message?: string };
			toast.error(error.message || "Ошибка при регистрации");
		}
	}, [formData, router]);

	const steps = [
		<RegisterEmail onChange={(email) => setFormData((prev) => ({ ...prev, email }))} onNext={goNext} />,
		<RegisterPassword
			onChange={(password) => setFormData((prev) => ({ ...prev, password }))}
			onNext={goNext}
			onPrev={goBack}
		/>,
		<RegisterConfirmPassword
			password={formData.password}
			onChange={(confirmPassword) => setFormData((prev) => ({ ...prev, confirmPassword }))}
			onNext={goNext}
			onPrev={goBack}
		/>,
		<RegisterName onChange={(name) => setFormData((prev) => ({ ...prev, name }))} onNext={goNext} onPrev={goBack} />,
		<RegisterNotifications onFinish={handleFinish} onPrev={goBack} />,
	];

	return (
		<AuthLayout>
			{steps[step]}
			{showSplash && <SplashScreen />}
		</AuthLayout>
	);
};
