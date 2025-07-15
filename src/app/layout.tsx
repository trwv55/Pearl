import { AuthProvider } from "@/providers/AuthProvider";
import SplashProvider from "@/providers/SplashProvider";
import { Toaster } from "sonner";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
        return (
                <html lang="ru">
                        <body>
                                <SplashProvider>
                                        <AuthProvider>
                                                {children}
                                                <Toaster position="bottom-left" richColors />
                                        </AuthProvider>
                                </SplashProvider>
                        </body>
                </html>
        );
}
