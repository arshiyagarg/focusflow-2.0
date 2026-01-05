import { create } from "zustand";
import axios from "axios";


const API_URL = import.meta.env.VITE_API_URL;
axios.defaults.withCredentials = true;

export interface Progress {
    id: string;
    userId: string;
    focusStreak: number;
    maxStreak: number;
    completedSessions: number;
    skills: Record<string, { xp: number; topics: string[] }>;
    lastActive: string;
    lastStreakDate: string;
    createdAt: string;
    updatedAt: string;
}

interface ProgressStore {
    progress: Progress | null;
    isLoading: boolean;
    getOrUpdateProgress: () => Promise<boolean>;
    fetchProgress: () => Promise<boolean>;
}

export const useProgressStore = create<ProgressStore> ((set,get) => ({
    progress: null,
    isLoading: false,
    getOrUpdateProgress: async () => {
        set({ isLoading: true });
        try {
            const response = await axios.get(`${API_URL}/api/progress/me`);
            set({ progress: response.data, isLoading: false });
            return true;
        } catch(error) {
            console.error("[Progress Store] Fetch error:", error);
            set({ isLoading: false });
            return false;
        }
    },
    fetchProgress: async () => {
        return await get().getOrUpdateProgress();
    }
}))