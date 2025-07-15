"use client";

import { ProtectedRoute } from "@/providers/ProtectedRoute";
import { userStore } from "@/stores/userStore";

export default function Home() {
	console.log("userStore", userStore);
	return (
		<ProtectedRoute>
			<h2>{userStore.user?.displayName}</h2>
		</ProtectedRoute>
	);
}
