import React from "react";
import Image from "next/image";
import styles from "./MainPageTopBar.module.css";
import logoUrl from "../../../../public/logo-main.svg";
import { userStore } from "@/entities/user/store";

interface MainPageTopBarProps {
	logoAlt?: string;
	logoWidth?: number;
	logoHeight?: number;
}

export const MainPageTopBar: React.FC<MainPageTopBarProps> = ({ logoAlt = "Логотип", logoWidth = 40, logoHeight = 40 }) => {
	const name = userStore.displayName;

	return (
		<header className={styles.topBar}>
			<h1 className={styles.title}>
				Привет,
				<br />
				<span>{name}</span>
			</h1>
			<div className={styles.logoContainer}>
				<Image src={logoUrl} alt={logoAlt} width={logoWidth} height={logoHeight} className={styles.logo} priority />
			</div>
		</header>
	);
};
