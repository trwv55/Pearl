"use client";

import { useEffect } from "react";
import "./auth-layout.css";

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
