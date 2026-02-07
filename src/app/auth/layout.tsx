"use client";

import "./auth-layout.css";
import { useEffect } from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		document.documentElement.classList.add("auth-page");
		document.body.classList.add("auth-page");

		return () => {
			document.documentElement.classList.remove("auth-page");
			document.body.classList.remove("auth-page");
		};
	}, []);

	return <>{children}</>;
}
