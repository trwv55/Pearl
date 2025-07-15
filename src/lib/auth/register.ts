import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export const registerUser = async (email: string, password: string, name?: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // обновляем профиль если передали имя
        if (name && name.trim().length > 0) {
                await updateProfile(userCredential.user, {
                        displayName: name,
                });
        }

        // создаем документ профиля пользователя в Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
                email,
                name: name ?? "",
                createdAt: serverTimestamp(),
        });

	return userCredential.user;
};
