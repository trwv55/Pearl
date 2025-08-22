import { ReactNode } from "react";
import styles from "./EmptyTaskState.module.css";

interface EmptyStateProps {
	children: ReactNode;
}

export function EmptyTaskState({ children }: EmptyStateProps) {
	return (
		<div className={styles.emptyWrap}>
			<div className={styles.emptyTitle}>{children}</div>
		</div>
	);
}
