"use client";

import { Auth } from "@/components/auth";
import { useRouter } from "next/navigation";

export default function AuthStartPage() {
    const router = useRouter();

    return (
        <main className="flex flex-col items-center justify-center min-h-screen">
            <Auth onNext={() => router.push("/auth/register")} />
        </main>
    );
}
