"use client";

import { Auth } from "@/features/auth";
import { AuthLayout } from "@/features/auth/layout/AuthLayout";

export default function AuthStartPage() {
	return (
		<AuthLayout>
			<Auth />
		</AuthLayout>
	);
}
