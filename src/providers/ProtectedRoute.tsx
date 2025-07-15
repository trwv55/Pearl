"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { userStore } from "@/stores/userStore";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  useEffect(() => {
    if (userStore.isNewUser === false) {
      router.replace("/auth");
    }
  }, [router, userStore.isNewUser]);

  if (userStore.isNewUser === null || userStore.isNewUser === false) {
    return null;
  }

  return <>{children}</>;
};
