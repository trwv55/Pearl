"use client";

import { CreateTask } from "@/features/CreatTask";
import { ProtectedRoute } from "@/app/providers/ProtectedRoute";

export default function CreateTaskPage() {
	return (
		<ProtectedRoute>
			<CreateTask />
		</ProtectedRoute>
	);
}
