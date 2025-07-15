"use client";
import Lottie from "lottie-react";
import logoAnimation from "@/shared/data/logo.json";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: '#7b61ff' }}>
      <Lottie animationData={logoAnimation} loop={true} style={{ width: 200, height: 200 }} />
    </div>
  );
}
