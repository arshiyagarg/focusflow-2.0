import { create } from 'zustand';
import axios from 'axios';

// Backend URL from your Docker/server config
const API_URL = "http://localhost:3001";

// Ensure cookies (JWT) are sent with every request
axios.defaults.withCredentials = true;

// Interfaces remain the same as your current model
export interface UserPreferences {
  focusSessionLength: string;
  breakLength: string;
  focusBreakers: string[];
  preferredOutput: string;
  detailLevel: string;
  colorTheme: string;
  audioSpeed: string;
  videoSpeed: string;
  sessionStyle: string;
  progressTracking: string;
  energyLevel: string;
  scrollSpeed: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  preferences?: UserPreferences;
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  contents: any[];
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  contents: [],

  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      set({
        user: response.data.user,
        isAuthenticated: true,
      });
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  },

  signup: async (email, password, name) => {
    try {
      // Mapping 'name' to 'fullName' as expected by your backend controller
      const response = await axios.post(`${API_URL}/api/auth/register`, { 
        email, 
        password, 
        fullName: name 
      });
      set({
        user: response.data.user,
        isAuthenticated: true,
      });
      return true;
    } catch (error) {
      console.error("Signup failed:", error);
      return false;
    }
  },

  updateProfile: async (updates) => {
    try {
      const { user } = get();
      if (!user) return;

      // If updating preferences from the Quest, call the specific save endpoint
      if (updates.preferences) {
        await axios.post(`${API_URL}/api/preferences/save`, updates.preferences);
      }

      set({ user: { ...user, ...updates } });
    } catch (error) {
      console.error("Profile update failed:", error);
    }
  },

  logout: async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`);
      set({ user: null, isAuthenticated: false, contents: [] });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }
}));