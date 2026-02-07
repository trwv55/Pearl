import { cn } from "@/shared/lib/utils";
import styles from "./AuthInput.module.css";
import { useState } from "react";
import { EyeIcon } from "@/shared/assets/icons/EyeIcon";

type AuthInputProps = {
	title: string;
	icon: string;
	placeholder?: string;
	value?: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onEnterKey?: () => void;
	className?: string;
	type?: string;
	error?: boolean;
	errorTitle?: string | null;
};

export const AuthInput = ({
	title,
	icon,
	placeholder,
	value,
	onChange,
	onEnterKey,
	className,
	error,
	type = "text",
	errorTitle,
}: AuthInputProps) => {
	const errorIcon = "❌";
	const isPassword = type === "password";
	const [showPassword, setShowPassword] = useState(false);
	const hasValue = value && value.length > 0;
	const shouldShowEyeIcon = isPassword;

	const togglePasswordVisibility = () => {
		if (hasValue) {
			setShowPassword((prev) => !prev);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && onEnterKey) {
			onEnterKey();
		}
	};

	const inputType = isPassword && showPassword ? "text" : type;

	return (
		<div className={cn("flex flex-col items-center gap-6 text-white")}>
			<div className={styles.top}>
				<h1 className={styles.title}>{error ? errorTitle : title}</h1>
				<br />
				<div className="text-[40px]">{error ? errorIcon : icon}</div>
			</div>
			<div className={cn("w-full", styles.inputWrapper)}>
				<input
					type={inputType}
					className={cn(styles.input, className, error && styles.error, shouldShowEyeIcon && styles.inputWithIcon)}
					placeholder={placeholder}
					value={value}
					onChange={onChange}
					onKeyDown={handleKeyDown}
				/>
				{shouldShowEyeIcon && (
					<button
						type="button"
						onClick={togglePasswordVisibility}
						className={cn(styles.eyeButton, !hasValue && styles.eyeButtonDisabled)}
						aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
						disabled={!hasValue}
					>
						<EyeIcon isVisible={showPassword} />
					</button>
				)}
			</div>
		</div>
	);
};
