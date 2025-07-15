"use client";

import { ProtectedRoute } from "@/providers/ProtectedRoute";
import { userStore } from "@/stores/userStore";

export default function Home() {
  return (
    <ProtectedRoute>
      <h2>{userStore.user?.displayName}</h2>
    </ProtectedRoute>
  );
}
