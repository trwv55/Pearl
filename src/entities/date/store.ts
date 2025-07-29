import { makeAutoObservable } from "mobx";

class DateStore {
    selectedDate: Date = new Date();

    constructor() {
        makeAutoObservable(this);
    }

    setSelectedDate(date: Date) {
        this.selectedDate = date;
    }
}

export const dateStore = new DateStore();
