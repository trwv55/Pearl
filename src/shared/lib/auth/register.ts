"use client";

import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "../firebase";

export const registerUser = async (email: string, password: string, name?: string) => {
	const userCredential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);

	// обновляем профиль если передали имя
	if (name && name.trim().length > 0) {
		await updateProfile(userCredential.user, {
			displayName: name,
		});
	}

	// создаем документ профиля пользователя в Firestore
	await setDoc(doc(getFirebaseDb(), "users", userCredential.user.uid), {
		email,
		name: name ?? "",
		createdAt: serverTimestamp(),
	});

	return userCredential.user;
};
