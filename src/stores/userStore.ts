import { makeAutoObservable } from "mobx";
import { User } from "firebase/auth";

class UserStore {
	user: User | null = null;
	isNewUser: boolean | null = null;
	isLoading = true;

	constructor() {
		makeAutoObservable(this);
	}

	setUser(user: User | null) {
		this.user = user;
		this.isLoading = false;
	}

	setIsNewUser(value: boolean | null) {
		this.isNewUser = value;
	}

	setLoading(value: boolean) {
		this.isLoading = value;
	}

	get isAuthenticated() {
		return !!this.user;
	}
}

export const userStore = new UserStore();
