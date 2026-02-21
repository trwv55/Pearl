"use client";

import { useRouter } from "next/navigation";
import { AppBack } from "@/shared/assets/icons/AppBack";
import { LogoIcon } from "@/shared/assets/svg/LogoIcon";
import styles from "./topBar.module.css";
import Link from "next/link";

interface TopBarProps {
	title: string;
	logoHref?: string;
	onBack?: () => void;
}

export const TopBar = ({ title, logoHref = "/", onBack }: TopBarProps) => {
	const router = useRouter();

	const handleBack = () => {
		if (onBack) {
			onBack();
		} else {
			router.back();
		}
	};

	return (
		<div className="w-full flex items-center justify-between">
			<button className="w-[52]" onClick={handleBack} aria-label="Назад">
				<AppBack />
			</button>

			<h2 className={styles.title}>{title}</h2>

			<Link href={logoHref} aria-label="На главную">
				<LogoIcon />
			</Link>
		</div>
	);
};
