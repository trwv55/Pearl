"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { userStore } from "@/stores/userStore";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	useEffect(() => {
		userStore.setLoading(true);

		const unsubscribe = onAuthStateChanged(auth, async user => {
			if (user) {
				console.log("hii");
				userStore.setUser(user);
				const snap = await getDoc(doc(db, "users", user.uid));
				userStore.setIsNewUser(!snap.exists());
			} else {
				userStore.setUser(null);
				userStore.setIsNewUser(null);
			}
		});
		return () => unsubscribe();
	}, []);

	return <>{children}</>;
};
