import { create } from 'zustand';
import axios from 'axios';
import { UserPreferences } from './useAuthStore';

const API_URL = "http://localhost:3001";
axios.defaults.withCredentials = true;

interface PreferencesStore {
    preferences: UserPreferences | null;
    setPreferences: (preferences: UserPreferences) => void;
    updatePreferences: (preferences: Partial<UserPreferences>) => void;
    savePreferences: (preferences: UserPreferences) => Promise<boolean>;
}


export const usePreferencesStore = create<PreferencesStore>((set, get) => ({
    preferences: null,

    setPreferences: (preferences: UserPreferences) => set({ preferences }),

    updatePreferences: (preferences: Partial<UserPreferences>) => {
        const current = get().preferences;
        if (current) {
            set({ preferences: { ...current, ...preferences } as UserPreferences });
        }
    },
    
    savePreferences: async (preferences: UserPreferences) => {
        try {
            const response = await axios.post(`${API_URL}/api/preferences/save`, preferences);
            set({ preferences: response.data });
            return true;
        } catch (error) {
            console.error("Failed to save preferences:", error);
            return false;
        }
    }
}));
