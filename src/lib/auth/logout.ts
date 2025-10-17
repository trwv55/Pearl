"use client";

import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "../firebase";
import { taskStore } from "@/entities/task/store";

export const logout = async () => {
	localStorage.removeItem("splashShown"); // Чтобы показывать splash screen при входе
	taskStore.setSelectedDate(new Date()); // Чтобы при входе показывался текущий день
        return await signOut(getFirebaseAuth());
};
