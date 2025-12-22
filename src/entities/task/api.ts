"use client";

import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDocs,
	query,
	runTransaction,
	serverTimestamp,
	setDoc,
	updateDoc,
	where,
	getDoc,
} from "firebase/firestore";
import { addDays, startOfDay } from "date-fns";
import { getFirebaseDb } from "@/shared/lib/firebase";
import { Task } from "./types";

export interface TaskPayload {
	title: string;
	comment: string;
	date: Date;
	emoji: string;
	isMain: boolean;
	markerColor: string;
	time: number | null;
}

export const addTask = async (userId: string, payload: TaskPayload) => {
	const { title, comment, date, emoji, isMain, markerColor, time } = payload;
	const db = getFirebaseDb();
	const ref = doc(collection(db, "users", userId, "tasks"));
	const id = ref.id;

	await setDoc(ref, {
		id,
		userId,
		title,
		comment,
		date,
		emoji,
		isMain,
		markerColor,
		time,
		isCompleted: false,
		completedAt: null,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
	});
};

export const getTasksByDate = async (userId: string, date: Date) => {
	const start = startOfDay(date);
	const end = addDays(start, 1);
	const db = getFirebaseDb();
	const q = query(collection(db, "users", userId, "tasks"), where("date", ">=", start), where("date", "<", end));
	const snapshot = await getDocs(q);
	return snapshot.docs.map((doc) => {
		const data = doc.data();
		return {
			id: doc.id,
			title: data.title,
			comment: data.comment,
			date: data.date.toDate ? data.date.toDate() : data.date,
			emoji: data.emoji,
			isMain: data.isMain,
			markerColor: data.markerColor,
			isCompleted: data.isCompleted,
			completedAt: data.completedAt?.toDate() || null,
			time: typeof data.time === "number" ? data.time : null,
		};
	});
};

export const getTasksForRange = async (userId: string, startDate: Date, endDate: Date): Promise<Task[]> => {
	const db = getFirebaseDb();
	const q = query(
		collection(db, "users", userId, "tasks"),
		where("date", ">=", startOfDay(startDate)),
		where("date", "<", startOfDay(addDays(endDate, 1))),
	);

	const snapshot = await getDocs(q);

	return snapshot.docs.map((doc) => {
		const data = doc.data();
		return {
			id: doc.id,
			title: data.title,
			comment: data.comment,
			date: data.date.toDate ? data.date.toDate() : data.date,
			emoji: data.emoji,
			isMain: data.isMain,
			markerColor: data.markerColor,
			isCompleted: data.isCompleted,
			completedAt: data.completedAt?.toDate() || null,
			time: typeof data.time === "number" ? data.time : null,
		} as Task;
	});
};

export const deleteTask = async (userId: string, taskId: string) => {
	const db = getFirebaseDb();
	await deleteDoc(doc(db, "users", userId, "tasks", taskId));
};

export const getTaskById = async (userId: string, taskId: string): Promise<Task | null> => {
	const db = getFirebaseDb();
	const taskRef = doc(db, "users", userId, "tasks", taskId);

	try {
		const taskDoc = await getDoc(taskRef);
		if (!taskDoc.exists()) {
			return null;
		}

		const data = taskDoc.data();
		return {
			id: taskDoc.id,
			title: data.title,
			comment: data.comment,
			date: data.date.toDate ? data.date.toDate() : data.date,
			emoji: data.emoji,
			isMain: data.isMain,
			markerColor: data.markerColor,
			isCompleted: data.isCompleted,
			completedAt: data.completedAt?.toDate() || null,
			time: typeof data.time === "number" ? data.time : null,
		} as Task;
	} catch (e) {
		console.error("Ошибка при получении задачи: ", e);
		throw e;
	}
};

export const updateTask = async (userId: string, taskId: string, payload: Partial<TaskPayload>) => {
	const db = getFirebaseDb();
	const taskRef = doc(db, "users", userId, "tasks", taskId);

	try {
		// Проверяем существование задачи
		const taskDoc = await getDoc(taskRef);
		if (!taskDoc.exists()) {
			throw new Error("Задача не найдена");
		}

		// Подготавливаем данные для обновления
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const updateData: any = {
			updatedAt: serverTimestamp(),
		};

		if (payload.title !== undefined) updateData.title = payload.title;
		if (payload.comment !== undefined) updateData.comment = payload.comment;
		if (payload.date !== undefined) updateData.date = payload.date;
		if (payload.emoji !== undefined) updateData.emoji = payload.emoji;
		if (payload.isMain !== undefined) updateData.isMain = payload.isMain;
		if (payload.markerColor !== undefined) updateData.markerColor = payload.markerColor;
		if (payload.time !== undefined) updateData.time = payload.time;

		await updateDoc(taskRef, updateData);

		// Получаем обновленные данные
		const updatedDoc = await getDoc(taskRef);
		if (!updatedDoc.exists()) {
			throw new Error("Задача не найдена после обновления");
		}

		const data = updatedDoc.data();
		return {
			id: updatedDoc.id,
			title: data.title,
			comment: data.comment,
			date: data.date.toDate ? data.date.toDate() : data.date,
			emoji: data.emoji,
			isMain: data.isMain,
			markerColor: data.markerColor,
			isCompleted: data.isCompleted,
			completedAt: data.completedAt?.toDate() || null,
			time: typeof data.time === "number" ? data.time : null,
		} as Task;
	} catch (e) {
		console.error("Ошибка при обновлении задачи: ", e);
		throw e;
	}
};

export const toggleTaskCompletion = async (userId: string, taskId: string) => {
	const db = getFirebaseDb();
	const taskRef = doc(db, "users", userId, "tasks", taskId);

	try {
		// Выполняем транзакцию для безопасного обновления
		await runTransaction(db, async (transaction) => {
			const taskDoc = await transaction.get(taskRef);
			if (!taskDoc.exists()) throw new Error("Задача не найдена");

			const data = taskDoc.data();
			const currentStatus = data.isCompleted;

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const updateData: any = {
				isCompleted: !currentStatus,
				updatedAt: serverTimestamp(),
				completedAt: !currentStatus ? serverTimestamp() : null,
			};

			transaction.update(taskRef, updateData);
		});

		// Получаем обновленные данные
		const updatedDoc = await getDoc(taskRef);
		return updatedDoc.data() as Task;
	} catch (e) {
		console.error("Ошибка переключения статуса задачи: ", e);
		throw e;
	}
};
