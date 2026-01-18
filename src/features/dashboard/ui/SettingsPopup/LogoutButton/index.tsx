import React from "react";
import { LogOut } from "lucide-react";
import { logout } from "@/shared/lib/auth/logout";
import styles from "./LogoutButton.module.css";

export const LogoutButton: React.FC = () => {
	const handleLogout = async () => {
		try {
			await logout();
		} catch (error) {
			console.error("Ошибка при выходе:", error);
		}
	};

	return (
		<div className={styles.logoutContainer}>
			<button className={styles.logoutButton} onClick={handleLogout} type="button">
				<LogOut className={styles.logoutIcon} size={16} />
				<span className={styles.logoutLabel}>Выйти</span>
			</button>
		</div>
	);
};

