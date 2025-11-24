"use client";
import { toast } from "sonner";
import { UndoToast } from "@/features/dashboard/ui/shared/ui/UndoToast";

export function showUndoToast({
	title = "Задача удалена",
	duration = 40000,
	onUndo,
}: {
	title?: string;
	duration?: number;
	onUndo?: () => void;
}) {
	const id = toast.custom(
		t => (
			<UndoToast
				title={title}
				onUndo={() => {
					onUndo?.();
					toast.dismiss(t);
				}}
				onClose={() => toast.dismiss(t)}
			/>
		),
		{ duration },
	);

	return id;
}
