export interface Session {
    id: string;
    userId: string;
    startTime: string;
    endTime: string | null;
    contentId: string;
    focusScore: number | null;
}