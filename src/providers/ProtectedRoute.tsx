"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { userStore } from "@/entities/user/store";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
        const router = useRouter();
        const [loading, setLoading] = useState(true);

        useEffect(() => {
                const unsubscribe = onAuthStateChanged(auth, user => {
                        userStore.setUser(user);
                        if (!user) {
                                router.replace("/auth");
                        }
                        setLoading(false);
                });
                return () => unsubscribe();
        }, [router]);

        if (loading) {
                return null;
        }

        return <>{children}</>;
};
