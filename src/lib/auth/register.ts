import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase";

export const registerUser = async (email: string, password: string, name?: string) => {
	const userCredential = await createUserWithEmailAndPassword(auth, email, password);

	// обновляем профиль если передали имя
	if (name && name.trim().length > 0) {
		await updateProfile(userCredential.user, {
			displayName: name,
		});
	}

	return userCredential.user;
};
