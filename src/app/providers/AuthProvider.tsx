"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/shared/lib/firebase";
import { userStore } from "@/entities/user/store";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
        useEffect(() => {
                const auth = getFirebaseAuth();
                const unsubscribe = onAuthStateChanged(auth, user => {
                        userStore.setUser(user);
                });
                return () => unsubscribe();
        }, []);

	return <>{children}</>;
};
