"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "../firebase";

export const login = async (email: string, password: string) => {
        return await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
};
