"use client";

import { Auth } from "@/features/auth";
import { AuthLayout } from "@/features/auth/layout/AuthLayout";
import { useRouter } from "next/navigation";

export default function AuthStartPage() {
	const router = useRouter();

	return (
		// <main className="flex flex-col items-center justify-center min-h-screen">
		<AuthLayout>
			<Auth />
		</AuthLayout>
		// </main>
	);
}
