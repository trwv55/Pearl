"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { userStore } from "@/entities/user/store";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/shared/lib/firebase";
import { ROUTES } from "@/shared/lib/routes";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
	const router = useRouter();
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const auth = getFirebaseAuth();
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			userStore.setUser(user);
			if (!user) {
				router.replace(ROUTES.AUTH);
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
