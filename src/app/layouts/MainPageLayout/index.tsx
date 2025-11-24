import styles from "./MainPageLayout.module.css";

interface LayoutProps {
	children: React.ReactNode;
	className?: string;
}

export const MainPageLayout = ({ children, className = "" }: LayoutProps) => {
	return <div className={`${styles.container} ${className}`}>{children}</div>;
};
