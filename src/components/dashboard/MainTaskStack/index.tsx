import { useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Task } from "@/entities/task/types";
import { MainTaskItem } from "@/components/dashboard/MainTaskItem";
import styles from "./MainTaskStack.module.css";

interface MainTaskStackProps {
        tasks: Task[];
        isExpanded?: boolean;
        onExpandChange?: (expanded: boolean) => void;
}

export const MainTaskStack: React.FC<MainTaskStackProps> = ({ tasks, isExpanded: controlledExpanded, onExpandChange }) => {
        const [uncontrolledExpanded, setUncontrolledExpanded] = useState(false);
        const isControlled = controlledExpanded !== undefined;
        const isExpanded = isControlled ? controlledExpanded : uncontrolledExpanded;
        const [collapsedHeight, setCollapsedHeight] = useState<number | null>(null);
        const firstItemRef = useRef<HTMLDivElement | null>(null);

        const handleToggle = () => {
                const next = !isExpanded;
                if (!isControlled) {
                        setUncontrolledExpanded(next);
                }
                onExpandChange?.(next);
        };

	useLayoutEffect(() => {
		if (firstItemRef.current) {
			setCollapsedHeight(firstItemRef.current.offsetHeight);
		}
	}, [tasks]);

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
							if (!isExpanded && index === 0) {
								handleToggle();
							}
						}}
						className={styles.taskItemWrapper}
					>
						<div className={styles.taskItemWrap} ref={index === 0 ? firstItemRef : null}>
							<MainTaskItem task={task} />
						</div>
					</motion.div>
				);
			})}
		</motion.div>
	);
};
