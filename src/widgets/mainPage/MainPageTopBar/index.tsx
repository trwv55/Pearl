import React from "react";
import Image from "next/image";
import { observer } from "mobx-react-lite";
import styles from "./MainPageTopBar.module.css";
import { userStore } from "@/entities/user/store";

interface MainPageTopBarProps {
	logoAlt?: string;
	logoWidth?: number;
	logoHeight?: number;
}

export const MainPageTopBar: React.FC<MainPageTopBarProps> = observer(
	({ logoAlt = "Логотип", logoWidth = 40, logoHeight = 40 }) => {
		console.log("userStore", userStore);
		const name = userStore.displayName;

		return (
			<header className={styles.topBar}>
				<h1 className={styles.title}>
					Привет,
					<br />
					<span>{name}</span>
				</h1>
				<div className={styles.logoContainer}>
					<Image
						src="/logo-main.svg"
						alt={logoAlt}
						width={logoWidth}
						height={logoHeight}
						className={styles.logo}
						priority
					/>
				</div>
			</header>
		);
	},
);
