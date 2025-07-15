import { makeAutoObservable } from "mobx";
import { User } from "firebase/auth";

class UserStore {
        user: User | null = null;
        isNewUser: boolean | null = null;

	constructor() {
		makeAutoObservable(this);
	}

        setUser(user: User | null) {
                this.user = user;
        }

        setIsNewUser(value: boolean | null) {
                this.isNewUser = value;
        }

	get isAuthenticated() {
		return !!this.user;
	}
}

export const userStore = new UserStore();
