import { makeAutoObservable } from "mobx";
import { User } from "firebase/auth";

class UserStore {
	user: User | null = null;

	constructor() {
		makeAutoObservable(this);
	}

	setUser(user: User | null) {
		this.user = user;
	}

	get isAuthenticated() {
		return !!this.user;
	}
}

export const userStore = new UserStore();
