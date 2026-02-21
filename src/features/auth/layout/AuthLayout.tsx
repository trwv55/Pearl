 "use client";

import { useEffect } from "react";
import styles from "./AuthLayout.module.css";

type Props = {
	children: React.ReactNode;
};

export const AuthLayout = ({ children }: Props) => {
	useEffect(() => {
		document.documentElement.classList.add("auth-page");
		document.body.classList.add("auth-page");

		return () => {
			document.documentElement.classList.remove("auth-page");
			document.body.classList.remove("auth-page");
		};
	}, []);

	return <div className={styles.wrap} data-page="auth">{children}</div>;
};
