"use client";

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/shared/lib/firebase";

export const getUserProfile = async (uid: string) => {
    const snap = await getDoc(doc(getFirebaseDb(), "users", uid));
    return snap.exists() ? snap.data() : null;
};

export const createUserProfile = async (uid: string, data: Record<string, unknown>) => {
    await setDoc(doc(getFirebaseDb(), "users", uid), {
        ...data,
        createdAt: serverTimestamp(),
    });
};
