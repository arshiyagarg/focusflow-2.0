import { create } from "zustand";

interface StudyTempState {
    currentSession: any;
    contents: any[];
    streak: any;
    pauseSession: () => void;
    resumeSession: () => void;
    endSession: () => void;
    addContent: (content: any) => void;
    removeContent: (contentId: string) => void;
    startSession: (contentId: string) => void;
}

export const useStudyStore = create<StudyTempState>((set, get) => ({
    currentSession: null,
    contents: [],
    streak: null,
    pauseSession: () => {},
    resumeSession: () => {},
    endSession: () => {},
    addContent: (content: any) => {},
    removeContent: (contentId: string) => {},
    startSession: (contentId: string) => {},
}));
