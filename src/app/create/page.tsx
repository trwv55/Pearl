"use client";

import { CreateTask } from "@/features/CreatTask";
import { AppLayout } from "@/shared/layout/AppLayout/index";
import { ProtectedRoute } from "@/app/providers/ProtectedRoute";

export default function AuthStartPage() {
	return (
		<ProtectedRoute>
			<CreateTask />
		</ProtectedRoute>
	);
}
