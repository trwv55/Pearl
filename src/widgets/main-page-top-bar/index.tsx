import React, { useState } from "react";
import Image from "next/image";
import { observer } from "mobx-react-lite";
import styles from "./MainPageTopBar.module.css";
import { userStore } from "@/shared/model/userStore";
import { SettingsPopup } from "@/features/settings";

interface MainPageTopBarProps {
	logoAlt?: string;
	logoWidth?: number;
	logoHeight?: number;
}

export const MainPageTopBar: React.FC<MainPageTopBarProps> = observer(
	({ logoAlt = "Логотип", logoWidth = 40, logoHeight = 40 }) => {
		const name = userStore.displayName;
		const [isSettingsOpen, setIsSettingsOpen] = useState(false);

		return (
			<>
				<header className={styles.topBar}>
					<h1 className={styles.title}>
						Привет,
						<br />
						<span>{name}</span>
					</h1>
					<button className={styles.logoContainer} type="button" onClick={() => setIsSettingsOpen(true)}>
						<Image
							src="/logo-main.svg"
							alt={logoAlt}
							width={logoWidth}
							height={logoHeight}
							className={styles.logo}
							priority
						/>
					</button>
				</header>
				<SettingsPopup isVisible={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
			</>
		);
	},
);
