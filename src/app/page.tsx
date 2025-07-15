"use client";

import { ProtectedRoute } from "@/providers/ProtectedRoute";
import { userStore } from "@/stores/userStore";
import { observer } from "mobx-react-lite";

const Home = observer(() => {
        console.log("userStore", userStore);
        return (
                <ProtectedRoute>
                        <h2>{userStore.user?.displayName}</h2>
                </ProtectedRoute>
        );
});

export default Home;
