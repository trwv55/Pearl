"use client";
import { toast } from "sonner";
import { ToastMessage } from "@/shared/ui/ToastMessage";

export function showSuccessToast(title: string, duration = 3000) {
	return toast.custom((t) => <ToastMessage title={title} type="success" onClose={() => toast.dismiss(t)} />, {
		duration,
	});
}

export function showErrorToast(title: string, duration = 3000) {
	return toast.custom((t) => <ToastMessage title={title} type="error" onClose={() => toast.dismiss(t)} />, {
		duration,
	});
}
