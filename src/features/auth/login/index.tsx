"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginEmail } from "@/features/auth/ui/login/LoginEmail";
import { AuthLayout } from "../layout/AuthLayout";
import { LoginPassword } from "@/features/auth/ui/login/LoginPassword";
import { userStore } from "@/entities/user/store";
import SplashScreen from "@/shared/ui/TopBar/SplashScreen";
import { loginUser, isLoginSuccess } from "../lib/loginApi";

export const Login = () => {
	const [step, setStep] = useState(0);
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [error, setError] = useState<string | null>(null);
	const [showSplash, setShowSplash] = useState(false);
	const router = useRouter();

	const goNext = useCallback(() => setStep((prev) => prev + 1), []);
	const goBack = useCallback(() => setStep((prev) => Math.max(0, prev - 1)), []);

	const handleEmailChange = useCallback((email: string) => setFormData((prev) => ({ ...prev, email })), []);

	const handleFinish = useCallback(
		async (password: string) => {
			const result = await loginUser(formData.email, password);

			if (isLoginSuccess(result)) {
				userStore.setUser(result.user);

				if (typeof window !== "undefined" && !localStorage.getItem("splashShown")) {
					setShowSplash(true);
					localStorage.setItem("splashShown", "true");
					setTimeout(() => router.push("/"), 2000);
				} else {
					router.push("/");
				}
			} else {
				// Устанавливаем ошибку только если она не null (для других ошибок, не 400)
				setError(result.error || null);
			}
		},
		[formData.email, router],
	);

	return (
		<AuthLayout>
			{step === 0 && <LoginEmail onChange={handleEmailChange} onNext={goNext} />}
			{step === 1 && <LoginPassword onNext={handleFinish} onPrev={goBack} />}
			{showSplash && <SplashScreen />}
		</AuthLayout>
	);
};
