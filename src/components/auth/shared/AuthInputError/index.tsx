import { cn } from "@/lib/utils";
import styles from "../AuthInput/AuthInput.module.css";

type AuthInputProps = {
	title: string;
	placeholder?: string;
	value?: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	className?: string;
	type?: string;
};

export const AuthInputError = ({ title, placeholder, value, onChange, className, type = "text" }: AuthInputProps) => {
	return (
		<div className={cn("flex flex-col items-center gap-6 text-white", className)}>
			<div className={styles.top}>
				<h1 className={styles.title}>{title}</h1>
				<br />
				<div className="text-[32px]">❌</div>
			</div>
			<div className="w-full">
				<input
					type={type}
					className={cn(styles.input, styles.error)}
					placeholder={placeholder}
					value={value}
					onChange={onChange}
				/>
			</div>
		</div>
	);
};
