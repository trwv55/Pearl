import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export const getUserProfile = async (uid: string) => {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
};

export const createUserProfile = async (uid: string, data: Record<string, unknown>) => {
    await setDoc(doc(db, "users", uid), {
        ...data,
        createdAt: serverTimestamp(),
    });
};
