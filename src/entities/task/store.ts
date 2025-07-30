import { makeAutoObservable, runInAction } from "mobx";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { startOfDay, endOfDay } from "date-fns";
import { userStore } from "@/entities/user/store";

export interface Task {
  id: string;
  title: string;
  comment: string;
  date: Date;
  emoji: string;
  isMain: boolean;
  markerColor: string;
  isCompleted: boolean;
}

class TaskStore {
  tasks: Task[] = [];
  selectedDate: Date = new Date();

  constructor() {
    makeAutoObservable(this);
  }

  get mainTasks() {
    return this.tasks.filter(t => t.isMain);
  }

  get routineTasks() {
    return this.tasks.filter(t => !t.isMain);
  }

  setSelectedDate(date: Date) {
    this.selectedDate = date;
    void this.fetchTasksForDate(date);
  }

  async fetchTasksForDate(date: Date = this.selectedDate) {
    const user = userStore.user;
    if (!user) {
      runInAction(() => {
        this.tasks = [];
      });
      return;
    }

    const start = Timestamp.fromDate(startOfDay(date));
    const end = Timestamp.fromDate(endOfDay(date));

    const tasksRef = collection(db, "users", user.uid, "tasks");
    const q = query(tasksRef, where("date", ">=", start), where("date", "<=", end));
    const snap = await getDocs(q);

    const tasks: Task[] = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        comment: data.comment ?? "",
        date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
        emoji: data.emoji ?? "",
        isMain: data.isMain ?? false,
        markerColor: data.markerColor ?? "#3d00cb",
        isCompleted: data.isCompleted ?? false,
      } as Task;
    });

    runInAction(() => {
      this.tasks = tasks;
    });
  }
}

export const taskStore = new TaskStore();
