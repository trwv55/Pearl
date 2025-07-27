import { makeAutoObservable } from "mobx";
import { User } from "firebase/auth";

class UserStore {
	user: User | null = null;

	constructor() {
		makeAutoObservable(this);
	}

	get displayName() {
		return this.user?.displayName || null;
	}

	setUser(user: User | null) {
		this.user = user;
	}
}

export const userStore = new UserStore();
