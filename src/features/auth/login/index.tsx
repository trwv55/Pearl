"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginEmail } from "@/components/auth/login/LoginEmail";
import { AuthLayout } from "../layout/AuthLayout";
import { LoginPassword } from "@/components/auth/login/LoginPassword";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { userStore } from "@/entities/user/store";
import { toast } from "sonner";
import SplashScreen from "@/shared/ui/TopBar/SplashScreen";

export const Login = () => {
	const [step, setStep] = useState(0);
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [error, setError] = useState<string | null>(null);
	const [showSplash, setShowSplash] = useState(false);
	const router = useRouter();

	const goNext = useCallback(() => setStep(prev => prev + 1), []);
	const goBack = useCallback(() => setStep(prev => Math.max(0, prev - 1)), []);

	const handleEmailChange = useCallback((email: string) => setFormData(prev => ({ ...prev, email })), []);

        const handleFinish = useCallback(
                async (password: string) => {
                        try {
                                const cred = await signInWithEmailAndPassword(getFirebaseAuth(), formData.email, password);
				userStore.setUser(cred.user);

				if (typeof window !== "undefined" && !localStorage.getItem("splashShown")) {
					setShowSplash(true);
					localStorage.setItem("splashShown", "true");
					setTimeout(() => router.push("/"), 2000);
				} else {
					router.push("/");
				}
			} catch (err: unknown) {
				console.error("Login error:", err);

				let message = "Ошибка входа. Попробуйте ещё раз.";
				const error = err as { code?: string };

				if (error.code === "auth/user-not-found") {
					message = "Пользователь не найден";
				} else if (error.code === "auth/wrong-password") {
					message = "Неверный пароль";
				}

				setError(message);
				toast.error(message);
			}
		},
		[formData.email, formData.password, router],
	);

	return (
		<AuthLayout>
			{step === 0 && <LoginEmail onChange={handleEmailChange} onNext={goNext} />}
			{step === 1 && <LoginPassword onNext={handleFinish} onPrev={goBack} />}
			{showSplash && <SplashScreen />}
		</AuthLayout>
	);
};
