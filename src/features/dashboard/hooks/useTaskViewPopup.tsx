"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Task } from "@/entities/task/types";
import { TaskViewPopup } from "@/features/dashboard/ui/TaskViewPopup";
import { EditTaskPopup } from "@/features/dashboard/ui/EditTaskPopup";
import { DuplicateTaskPopup } from "@/features/dashboard/ui/DuplicateTaskPopup";

interface TaskViewPopupContextValue {
	openTask: (task: Task) => void;
	closeTask: () => void;
	openEditTask: (task: Task) => void;
	openDuplicateTask: (task: Task) => void;
}

const TaskViewPopupContext = createContext<TaskViewPopupContextValue | null>(null);

const ANIMATION_DURATION = 250;

export const TaskViewPopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [currentTask, setCurrentTask] = useState<Task | null>(null);
	const [isVisible, setIsVisible] = useState(false);
	const [editTask, setEditTask] = useState<Task | null>(null);
	const [isEditVisible, setIsEditVisible] = useState(false);
	const [duplicateTask, setDuplicateTask] = useState<Task | null>(null);
	const [isDuplicateVisible, setIsDuplicateVisible] = useState(false);
	const closingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const editTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const duplicateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (closingTimerRef.current) {
				clearTimeout(closingTimerRef.current);
			}
			if (editTimerRef.current) {
				clearTimeout(editTimerRef.current);
			}
			if (duplicateTimerRef.current) {
				clearTimeout(duplicateTimerRef.current);
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

	const openEditTask = useCallback((task: Task) => {
		if (editTimerRef.current) {
			clearTimeout(editTimerRef.current);
			editTimerRef.current = null;
		}
		setEditTask(task);
		setIsEditVisible(true);
	}, []);

	const closeEditTask = useCallback(() => {
		setIsEditVisible(false);
		if (editTimerRef.current) {
			clearTimeout(editTimerRef.current);
		}
		editTimerRef.current = setTimeout(() => {
			setEditTask(null);
			editTimerRef.current = null;
		}, ANIMATION_DURATION);
	}, []);

	const openDuplicateTask = useCallback((task: Task) => {
		if (duplicateTimerRef.current) {
			clearTimeout(duplicateTimerRef.current);
			duplicateTimerRef.current = null;
		}
		setDuplicateTask(task);
		setIsDuplicateVisible(true);
	}, []);

	const closeDuplicateTask = useCallback(() => {
		setIsDuplicateVisible(false);
		if (duplicateTimerRef.current) {
			clearTimeout(duplicateTimerRef.current);
		}
		duplicateTimerRef.current = setTimeout(() => {
			setDuplicateTask(null);
			duplicateTimerRef.current = null;
		}, ANIMATION_DURATION);
	}, []);

	const contextValue = useMemo(
		() => ({
			openTask,
			closeTask,
			openEditTask,
			openDuplicateTask,
		}),
		[openTask, closeTask, openEditTask, openDuplicateTask],
	);

	return (
		<TaskViewPopupContext.Provider value={contextValue}>
			{children}
			<TaskViewPopup task={currentTask} isVisible={isVisible} onClose={closeTask} />
			<EditTaskPopup task={editTask} isVisible={isEditVisible} onClose={closeEditTask} />
			<DuplicateTaskPopup task={duplicateTask} isVisible={isDuplicateVisible} onClose={closeDuplicateTask} />
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
