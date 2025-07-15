"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { userStore } from "@/stores/userStore";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
        useEffect(() => {
                const unsubscribe = onAuthStateChanged(auth, user => {
                        userStore.setUser(user);
                });
                return () => unsubscribe();
        }, []);

	return <>{children}</>;
};
