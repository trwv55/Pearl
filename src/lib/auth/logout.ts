import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { dateStore } from "@/entities/date/store";

export const logout = async () => {
    dateStore.setSelectedDate(new Date());
    return await signOut(auth);
};
