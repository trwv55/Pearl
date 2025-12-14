"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Task } from "@/entities/task/types";
import { TaskViewPopup } from "@/features/dashboard/ui/TaskViewPopup";

interface TaskViewPopupContextValue {
	openTask: (task: Task) => void;
	closeTask: () => void;
}

const TaskViewPopupContext = createContext<TaskViewPopupContextValue | null>(null);

const ANIMATION_DURATION = 250;

export const TaskViewPopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [currentTask, setCurrentTask] = useState<Task | null>(null);
	const [isVisible, setIsVisible] = useState(false);
	const closingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (closingTimerRef.current) {
				clearTimeout(closingTimerRef.current);
			}
		};
	}, []);

	const openTask = useCallback((task: Task) => {
		if (closingTimerRef.current) {
			clearTimeout(closingTimerRef.current);
			closingTimerRef.current = null;
		}
		setCurrentTask(task);
		setIsVisible(true);
	}, []);

	const closeTask = useCallback(() => {
		setIsVisible(false);
		if (closingTimerRef.current) {
			clearTimeout(closingTimerRef.current);
		}
		closingTimerRef.current = setTimeout(() => {
			setCurrentTask(null);
			closingTimerRef.current = null;
		}, ANIMATION_DURATION);
	}, []);

	const contextValue = useMemo(
		() => ({
			openTask,
			closeTask,
		}),
		[openTask, closeTask],
	);

	return (
		<TaskViewPopupContext.Provider value={contextValue}>
			{children}
			<TaskViewPopup task={currentTask} isVisible={isVisible} onClose={closeTask} />
		</TaskViewPopupContext.Provider>
	);
};

export const useTaskViewPopup = (): TaskViewPopupContextValue => {
	const context = useContext(TaskViewPopupContext);
	if (!context) {
		throw new Error("useTaskViewPopup must be used within a TaskViewPopupProvider");
	}
	return context;
};
