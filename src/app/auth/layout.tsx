import { AuthLayout } from "@/features/auth/layout/AuthLayout";

export default function AuthRouteLayout({ children }: { children: React.ReactNode }) {
	return <AuthLayout>{children}</AuthLayout>;
}
