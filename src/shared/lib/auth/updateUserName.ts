"use client";

import { updateProfile, reload } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "../firebase";

export const updateUserName = async (newName: string) => {
	const auth = getFirebaseAuth();
	const user = auth.currentUser;

	if (!user) {
		throw new Error("Пользователь не авторизован");
	}

	// Обновляем displayName в Firebase Authentication
	await updateProfile(user, {
		displayName: newName.trim(),
	});

	// Перезагружаем пользователя для получения обновленных данных
	await reload(user);

	// Обновляем name в Firestore
	await updateDoc(doc(getFirebaseDb(), "users", user.uid), {
		name: newName.trim(),
	});

	return user;
};

