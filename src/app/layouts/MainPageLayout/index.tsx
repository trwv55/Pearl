import { useEffect } from "react";
import styles from "./MainPageLayout.module.css";

interface LayoutProps {
	children: React.ReactNode;
	className?: string;
}

export const MainPageLayout = ({ children, className = "" }: LayoutProps) => {
	useEffect(() => {
		document.documentElement.classList.add("dash-page");
		document.body.classList.add("dash-page");

		return () => {
			document.documentElement.classList.remove("dash-page");
			document.body.classList.remove("dash-page");
		};
	}, []);

	return <div className={`${styles.container} ${className}`}>{children}</div>;
};
