import styles from "./StepCount.module.css";

interface StepCountProps {
	stepNumber: number;
	totalSteps?: number;
	label: string;
}

export const StepCount = ({ stepNumber, totalSteps = 6, label }: StepCountProps) => {
	return (
		<div className={styles.labelWrap}>
			<div className={styles.label}>
				<span>
					Шаг {stepNumber}/{totalSteps}{" "}
				</span>
				{label}
			</div>
		</div>
	);
};
