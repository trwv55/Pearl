import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Task } from "@/entities/task/types";
import { MainTaskItem } from "@/components/dashboard/MainTaskItem";
import styles from "./MainTaskStack.module.css";

interface MainTaskStackProps {
	tasks: Task[];
	isExpanded?: boolean;
	onExpandChange?: (expanded: boolean) => void;
	canExpand?: boolean;
}

export const MainTaskStack: React.FC<MainTaskStackProps> = ({
	tasks,
	isExpanded: controlledExpanded,
	onExpandChange,
	canExpand,
}) => {
	const [uncontrolledExpanded, setUncontrolledExpanded] = useState(false);
	const isControlled = controlledExpanded !== undefined;
	const isExpanded = isControlled ? controlledExpanded : uncontrolledExpanded; // Раскрытая стопка
	const prevTasksRef = useRef<string>("");

	console.log("isExpanded", isExpanded);

	useEffect(() => {
		if (isControlled) return;
		const ids = tasks.map(t => t.id).join(",");
		if (prevTasksRef.current !== ids) {
			setUncontrolledExpanded(false);
			prevTasksRef.current = ids;
		}
	}, [tasks, isControlled]);

	const handleToggle = useCallback(() => {
		const next = !isExpanded;
		if (!isControlled) {
			setUncontrolledExpanded(next);
		}
		onExpandChange?.(next);
	}, [isExpanded, isControlled, onExpandChange]);

	return (
		<motion.div
			transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
			className={`${styles.stack} ${isExpanded ? styles.expanded : ""}`}
		>
			{tasks.map((task, index) => {
				const offset = index * 10;
				const scale = 1 - index * 0.02;
				const z = tasks.length - index;

				return (
					<motion.div
						key={task.id}
						initial={false}
						animate={{
							y: isExpanded ? 0 : offset,
							scale: isExpanded ? 1 : scale,
							opacity: isExpanded || index === 0 ? 1 : 0.95,
						}}
						transition={{
							type: "tween",
							duration: 0.4,
							ease: "easeOut",
						}}
						style={{
							position: isExpanded ? "relative" : "absolute",
							top: 0,
							left: 0,
							width: "100%",
							zIndex: isExpanded ? 0 : z,
							cursor: !isExpanded && index === 0 ? "pointer" : "default",
						}}
						onClick={() => {
							if (!isExpanded && index === 0 && canExpand) {
								handleToggle();
							}
						}}
						className={styles.taskItemWrapper}
					>
						<div className={styles.taskItemWrap}>
							<MainTaskItem task={task} isExpanded={isExpanded} />
						</div>
					</motion.div>
				);
			})}
		</motion.div>
	);
};
