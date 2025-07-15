"use client";

import { CreateTask } from "@/features/CreatTask";
import { AppLayout } from "@/shared/layout/AppLayout/index";

export default function AuthStartPage() {
	return (
		<AppLayout>
			<CreateTask />
		</AppLayout>
	);
}
