"use client";
import { useEffect, useState } from "react";
import SplashScreen from "@/shared/ui/TopBar/SplashScreen";

export default function SplashProvider({ children }: { children: React.ReactNode }) {
	const [visible, setVisible] = useState(true);

	useEffect(() => {
		const t = setTimeout(() => setVisible(false), 2000);
		return () => clearTimeout(t);
	}, []);

	return (
		<>
			{visible && <SplashScreen />}
			{children}
		</>
	);
}
