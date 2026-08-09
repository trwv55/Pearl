import clsx from "clsx";
import styles from "./RefreshRing.module.css";

interface RefreshRingProps {
	pullDistance: number;
	isRefreshing: boolean;
	threshold: number;
}

// Кольцо-лоадер pull-to-refresh: белый бейдж с фиолетовым спиннером сверху по
// центру. При оттягивании плавно появляется и вращается по прогрессу, при
// обновлении крутится непрерывно.
export const RefreshRing = ({ pullDistance, isRefreshing, threshold }: RefreshRingProps) => {
	const visible = pullDistance > 0 || isRefreshing;
	const progress = Math.min(1, pullDistance / threshold);

	return (
		<div
			className={styles.wrap}
			style={{
				transform: `translateY(${pullDistance}px)`,
				opacity: visible ? 1 : 0,
			}}
			aria-hidden={!visible}
		>
			<div className={styles.badge} style={{ transform: `scale(${0.6 + progress * 0.4})` }}>
				<div
					className={clsx(styles.spinner, isRefreshing && styles.spinning)}
					style={isRefreshing ? undefined : { transform: `rotate(${progress * 270}deg)` }}
				/>
			</div>
		</div>
	);
};
