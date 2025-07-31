import {
    addDoc,
    collection,
    getDocs,
    query,
    serverTimestamp,
    where,
} from "firebase/firestore";
import { addDays, startOfDay } from "date-fns";
import { db } from "@/lib/firebase";

export interface TaskPayload {
    title: string;
    comment: string;
    date: Date;
    emoji: string;
    isMain: boolean;
    markerColor: string;
}

export const addTask = async (userId: string, payload: TaskPayload) => {
    const { title, comment, date, emoji, isMain, markerColor } = payload;
    await addDoc(collection(db, "users", userId, "tasks"), {
        title,
        comment,
        date,
        emoji,
        isMain,
        markerColor,
        isCompleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
};

export const getTasksByDate = async (userId: string, date: Date) => {
    const start = startOfDay(date);
    const end = addDays(start, 1);
    const q = query(
        collection(db, "users", userId, "tasks"),
        where("date", ">=", start),
        where("date", "<", end)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
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
        };
    });
};
