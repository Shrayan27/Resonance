"use client";

import { create } from "zustand";
import type { Track } from "@/lib/types";

export interface UserTaste {
  preferredGenres: string[];
  preferredArtists: string[];
  genreWeights: Record<string, number>;
  artistWeights: Record<string, number>;
  totalPlays: number;
  lastUpdated: number;
}

export interface UserAccountSafe {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  createdAt: number;
  taste: UserTaste;
}

interface AuthState {
  user: UserAccountSafe | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  isTasteModalOpen: boolean;
  authModalTab: "login" | "signup";

  openAuthModal: (tab?: "login" | "signup") => void;
  closeAuthModal: () => void;
  openTasteModal: () => void;
  closeTasteModal: () => void;
  setAuthModalTab: (tab: "login" | "signup") => void;

  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    preferredGenres?: string[];
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  recordListen: (track: Track) => Promise<void>;
  updateTaste: (
    preferredGenres: string[],
    preferredArtists?: string[],
  ) => Promise<{ success: boolean; error?: string }>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthModalOpen: false,
  isTasteModalOpen: false,
  authModalTab: "login",

  openAuthModal: (tab = "login") => set({ isAuthModalOpen: true, authModalTab: tab }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
  openTasteModal: () => set({ isTasteModalOpen: true }),
  closeTasteModal: () => set({ isTasteModalOpen: false }),
  setAuthModalTab: (tab) => set({ authModalTab: tab }),

  checkAuth: async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user || null, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }
      set({ user: data.user, isAuthModalOpen: false });
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message || "Connection error" };
    }
  },

  signup: async (data) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || "Signup failed" };
      }
      set({ user: resData.user, isAuthModalOpen: false });
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message || "Connection error" };
    }
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      set({ user: null, isTasteModalOpen: false });
    }
  },

  recordListen: async (track: Track) => {
    if (!get().user) return;
    try {
      const res = await fetch("/api/user/record-listen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.taste && get().user) {
          set((s) => (s.user ? { user: { ...s.user, taste: data.taste } } : {}));
        }
      }
    } catch {
      // Background recording failure is silent
    }
  },

  updateTaste: async (preferredGenres, preferredArtists) => {
    try {
      const res = await fetch("/api/user/taste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredGenres, preferredArtists }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to update taste" };
      }
      if (data.taste && get().user) {
        set((s) => (s.user ? { user: { ...s.user, taste: data.taste } } : {}));
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  },
}));
