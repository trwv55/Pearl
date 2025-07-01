"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginEmail } from "@/components/auth/login/LoginEmail";
import { AuthLayout } from "../layout/AuthLayout";
import { LoginPassword } from "@/components/auth/login/LoginPassword";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

export const Login = () => {
	const [step, setStep] = useState(0);
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const goNext = useCallback(() => setStep(prev => prev + 1), []);
	const goBack = useCallback(() => setStep(prev => Math.max(0, prev - 1)), []);

	const handleEmailChange = useCallback((email: string) => setFormData(prev => ({ ...prev, email })), []);

	const handlePasswordChange = useCallback((password: string) => setFormData(prev => ({ ...prev, password })), []);

        const handleFinish = useCallback(async () => {
                try {
                        await signInWithEmailAndPassword(auth, formData.email, formData.password);
                        router.push("/dashboard");
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
	}, [formData.email, formData.password, router]);

	return (
		<AuthLayout>
			{step === 0 && <LoginEmail onChange={handleEmailChange} onNext={goNext} />}
			{step === 1 && <LoginPassword onChange={handlePasswordChange} onNext={handleFinish} onPrev={goBack} />}
		</AuthLayout>
	);
};
