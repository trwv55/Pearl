import { makeAutoObservable, runInAction } from "mobx";
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

	updateUser(user: User | null) {
		runInAction(() => {
			this.user = user;
		});
	}

	// Метод для принудительного обновления после изменения свойств user
	// Временно устанавливаем null и обратно, чтобы MobX заметил изменение
	forceUpdate() {
		runInAction(() => {
			const currentUser = this.user;
			if (currentUser) {
				this.user = null;
				// Используем requestAnimationFrame для следующего кадра
				requestAnimationFrame(() => {
					runInAction(() => {
						this.user = currentUser;
					});
				});
			}
		});
	}
}

export const userStore = new UserStore();
