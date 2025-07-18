"use client";
import Lottie from "lottie-react";
import logoAnimation from "@/shared/data/logo.json";

export default function SplashScreen() {
	return (
		<div className="fixed inset-0 flex items-center justify-center" style={{ background: "var(--bg-register)" }}>
			<Lottie animationData={logoAnimation} loop={true} style={{ width: 200, height: 200 }} />
		</div>
	);
}
