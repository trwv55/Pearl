import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { dateStore } from "@/entities/date/store";
import { taskStore } from "@/entities/task/store";

export const logout = async () => {
    console.log("[logout] signing out");
    dateStore.setSelectedDate(new Date());
    taskStore.clearCache();
    return await signOut(auth);
};
