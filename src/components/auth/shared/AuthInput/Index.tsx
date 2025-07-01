import { cn } from "@/lib/utils";
import styles from "./AuthInput.module.css";

type AuthInputProps = {
	title: string;
	icon: string;
	placeholder?: string;
	value?: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
	className,
	error,
	type = "text",
	errorTitle,
}: AuthInputProps) => {
	const errorIcon = "❌";
	return (
		<div className={cn("flex flex-col items-center gap-6 text-white")}>
			<div className={styles.top}>
				<h1 className={styles.title}>{error ? errorTitle : title}</h1>
				<br />
				<div className="text-[32px]">{error ? errorIcon : icon}</div>
			</div>
			<div className="w-full">
				<input
					type={type}
					className={cn(styles.input, className, error && styles.error)}
					placeholder={placeholder}
					value={value}
					onChange={onChange}
				/>
			</div>
		</div>
	);
};
