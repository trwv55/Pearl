"use client";

import { useState } from "react";
import { StepEmail } from "../StepEmail";
import { StepIntro } from "../StepIntro";
import { StepPassword } from "../StepPassword";
import { StepConfirmPassword } from "../ConfirmPassword";
import { StepYourName } from "../StepYourName";
import { registerUser } from "@/lib/auth/register";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { StepNotifications } from "../StepNotifications";
import { userStore } from "@/stores/userStore";
import styles from "./RegistrationWrap.module.css";

export const RegistrationWrap = () => {
	const [step, setStep] = useState(0);
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		confirmPassword: "",
		name: "",
	});
	const router = useRouter();
	const goNext = () => setStep(prev => prev + 1);
	const goBack = () => setStep(prev => Math.max(0, prev - 1));

	const handleFinish = async () => {
		try {
			const user = await registerUser(formData.email, formData.password, formData.name);
			userStore.setUser(user); // Обновляем MobX
			router.push("/");
		} catch (err: unknown) {
			if (err instanceof Error) {
				console.error("Ошибка при регистрации", err.message);
				toast.error("Ошибка при регистрации", {
					description: err.message,
				});
			} else {
				console.error("Неизвестная ошибка", err);
				toast.error("Ошибка при регистрации");
			}
		}
	};

	const steps = [
		<StepIntro onNext={goNext} />,
		// <StepEmail
		// 	key="step-email"
		// 	value={formData.email}
		// 	onChange={email => setFormData(prev => ({ ...prev, email }))}
		// 	onNext={goNext}
		// 	goBack={goBack}
		// />,
		// <StepPassword
		// 	key="step-password"
		// 	value={formData.password}
		// 	onChange={password => setFormData(prev => ({ ...prev, password }))}
		// 	onNext={goNext}
		// 	goBack={goBack}
		// />,
		// <StepConfirmPassword
		// 	key="step-confirm-password"
		// 	value={formData.confirmPassword}
		// 	onChange={confirmPassword => setFormData(prev => ({ ...prev, confirmPassword }))}
		// 	onNext={goNext}
		// 	goBack={goBack}
		// />,
		// <StepYourName
		// 	key="step-name"
		// 	value={formData.name}
		// 	onChange={name => setFormData(prev => ({ ...prev, name }))}
		// 	onNext={goNext}
		// 	goBack={goBack}
		// />,
		// <StepNotifications onFinish={handleFinish} goBack={goBack} />,
	];

	return <div className={styles.wrap}>{steps[step]}</div>;
};
