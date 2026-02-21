import styles from "./AuthLayout.module.css";

type Props = {
	children: React.ReactNode;
};

export const AuthLayout = ({ children }: Props) => {
	return <div className={styles.wrap} data-page="auth">{children}</div>;
};
