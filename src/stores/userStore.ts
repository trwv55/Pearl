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
}

export const userStore = new UserStore();
