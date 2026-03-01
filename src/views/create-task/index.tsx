"use client";

import { CreateTask } from "@/features/create-task";
import { ProtectedRoute } from "@/app/providers/ProtectedRoute";

export const CreateTaskPage = () => {
	return (
		<ProtectedRoute>
			<CreateTask />
		</ProtectedRoute>
	);
};
