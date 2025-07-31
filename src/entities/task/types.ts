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
