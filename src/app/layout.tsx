import { AuthProvider } from "@/app/providers/AuthProvider";
import { Toaster } from "sonner";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="ru">
			<body>
				<AuthProvider>
					{children}
					<Toaster position="bottom-left" richColors />
				</AuthProvider>
			</body>
		</html>
	);
}
