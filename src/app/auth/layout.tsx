import { AuthLayout } from "@/app/layouts/AuthLayout";

export default function AuthRouteLayout({ children }: { children: React.ReactNode }) {
	return <AuthLayout>{children}</AuthLayout>;
}
