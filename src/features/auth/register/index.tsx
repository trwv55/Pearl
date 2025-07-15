"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "../layout/AuthLayout";
import { RegisterEmail } from "@/components/auth/register/RegisterEmail";
import { RegisterPassword } from "@/components/auth/register/RegisterPassword";
import { RegisterConfirmPassword } from "@/components/auth/register/RegisterConfirmPassword";
import { RegisterName } from "@/components/auth/register/RegisterName";
import { RegisterNotifications } from "@/components/auth/register/RegisterNotifications";
import { registerUser } from "@/lib/auth/register";
import { toast } from "sonner";
import { userStore } from "@/stores/userStore";

export const Register = () => {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
    });
    const router = useRouter();

    const goNext = useCallback(() => setStep(prev => prev + 1), []);
    const goBack = useCallback(() => setStep(prev => Math.max(0, prev - 1)), []);

    const handleFinish = useCallback(async () => {
        if (formData.password !== formData.confirmPassword) {
            toast.error("Пароли не совпадают");
            setStep(2);
            return;
        }
        try {
            const user = await registerUser(formData.email, formData.password, formData.name);
            userStore.setUser(user);
            userStore.setIsNewUser(true);
            router.push("/");
        } catch (err: unknown) {
            console.error("Register error:", err);
            const error = err as { message?: string };
            toast.error(error.message || "Ошибка при регистрации");
        }
    }, [formData, router]);

    const steps = [
        <RegisterEmail onChange={email => setFormData(prev => ({ ...prev, email }))} onNext={goNext} />,
        <RegisterPassword onChange={password => setFormData(prev => ({ ...prev, password }))} onNext={goNext} onPrev={goBack} />,
        <RegisterConfirmPassword
            password={formData.password}
            onChange={confirmPassword => setFormData(prev => ({ ...prev, confirmPassword }))}
            onNext={goNext}
            onPrev={goBack}
        />,
        <RegisterName onChange={name => setFormData(prev => ({ ...prev, name }))} onNext={goNext} onPrev={goBack} />,
        <RegisterNotifications onFinish={handleFinish} onPrev={goBack} />,
    ];

    return <AuthLayout>{steps[step]}</AuthLayout>;
};
