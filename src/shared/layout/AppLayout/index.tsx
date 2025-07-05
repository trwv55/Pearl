import styles from "./AppLayout.module.css";

type Props = {
	children: React.ReactNode;
};

export const AppLayout = ({ children }: Props) => {
	return <div className={styles.wrap}>{children}</div>;
};
