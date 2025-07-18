import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

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
