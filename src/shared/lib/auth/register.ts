"use client";

import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "../firebase";

export const registerUser = async (email: string, password: string, name?: string) => {
	const auth = getFirebaseAuth();
	const userCredential = await createUserWithEmailAndPassword(auth, email, password);

	// обновляем профиль если передали имя
	if (name && name.trim().length > 0) {
		await updateProfile(userCredential.user, {
			displayName: name,
		});
		// Перезагружаем пользователя, чтобы получить обновленный displayName
		await userCredential.user.reload();
	}

	// создаем документ профиля пользователя в Firestore
	try {
		await setDoc(doc(getFirebaseDb(), "users", userCredential.user.uid), {
			email,
			name: name ?? "",
			createdAt: serverTimestamp(),
		});
	} catch (firestoreError) {
		console.warn("Не удалось создать документ пользователя в Firestore:", firestoreError);
	}

	// Возвращаем актуального пользователя из auth.currentUser, чтобы гарантировать обновленный displayName
	return auth.currentUser || userCredential.user;
};
