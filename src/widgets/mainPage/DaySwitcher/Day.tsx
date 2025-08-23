import { motion } from "framer-motion";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { observer } from "mobx-react-lite";
import { taskStore } from "@/entities/task/store";
import styles from "./DaysSwitcher.module.css";

interface DayProps {
        day: Date;
        isActive: boolean;
        isNext: boolean;
        onSelect: () => void;
}

export const Day = observer(({ day, isActive, isNext, onSelect }: DayProps) => {
        const weekday = format(day, "EEEEEE", { locale: ru }).slice(0, 2);
        const hasTasks = taskStore.hasTasksForDate(day);

        return (
                <div className={`${styles.dayColumn} ${isNext ? styles.nextDay : ""} ${isActive ? styles.activeColumn : ""}`}>
                        <motion.button
                                onClick={onSelect}
                                className={`${styles.buttonWrapper} ${isActive ? styles.activeDay : ""}`}
                                animate={{
                                        scale: isActive ? 1.2 : 1,
                                        zIndex: isActive ? 2 : 1,
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        >
                                <span className={styles.dayNumber}>{format(day, "d")}</span>
                                {hasTasks && <span className={styles.taskDot} />}
                        </motion.button>
                        <span className={styles.dayName}>{weekday}</span>
                </div>
        );
});

export default Day;

