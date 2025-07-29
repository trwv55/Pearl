import { addDoc, collection, serverTimestamp, collectionGroup, query, where, Timestamp, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface TaskPayload {
    title: string;
    comment: string;
    date: Date;
    emoji: string;
    isMain: boolean;
    markerColor: string;
}

export interface Task {
    id: string;
    title: string;
    comment: string;
    date: Timestamp;
    emoji: string;
    isMain: boolean;
    markerColor: string;
    isCompleted: boolean;
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

export const getTasksForDateRange = async (
    userId: string,
    start: Date,
    end: Date,
): Promise<Task[]> => {
    const q = query(
        collection(db, "users", userId, "tasks"),
        where("date", ">=", Timestamp.fromDate(start)),
        where("date", "<=", Timestamp.fromDate(end)),
        orderBy("date", "asc"),
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Task, "id">) }));
};
