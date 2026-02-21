"use client";

import { useCallback, useState, memo } from "react";
import { useRouter } from "next/navigation";
import { LoginEmail } from "@/features/auth/ui/login/LoginEmail";
import { LoginPassword } from "@/features/auth/ui/login/LoginPassword";
import { userStore } from "@/entities/user/store";
import SplashScreen from "@/shared/ui/TopBar/SplashScreen";
import { loginUser, isLoginSuccess } from "../lib/loginApi";
import { ROUTES } from "@/shared/lib/routes";

export const Login = memo(() => {
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

	const handleEmailChange = useCallback((email: string) => {
		setFormData((prev) => ({ ...prev, email }));
	}, []);

	const handlePasswordChange = useCallback((password: string) => {
		setFormData((prev) => ({ ...prev, password }));
	}, []);

	const handleFinish = useCallback(async () => {
		const result = await loginUser(formData.email, formData.password);

		if (isLoginSuccess(result)) {
			userStore.setUser(result.user);

			if (typeof window !== "undefined" && !localStorage.getItem("splashShown")) {
				setShowSplash(true);
				localStorage.setItem("splashShown", "true");
				setTimeout(() => router.push(ROUTES.HOME), 2000);
			} else {
				router.push(ROUTES.HOME);
			}
		} else {
			setError(result.error || null);
		}
	}, [formData.email, formData.password, router]);

	return (
		<>
			{step === 0 && <LoginEmail value={formData.email} onChange={handleEmailChange} onNext={goNext} />}
			{step === 1 && (
				<LoginPassword
					value={formData.password}
					onChange={handlePasswordChange}
					onFinish={handleFinish}
					onPrev={goBack}
				/>
			)}
			{showSplash && <SplashScreen />}
		</>
	);
});

Login.displayName = "Login";
