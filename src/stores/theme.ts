"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ThemeDef {
  id: string;
  label: string;
  swatch: [string, string];
}

export const THEMES: ThemeDef[] = [
  { id: "emerald", label: "Emerald", swatch: ["#2ee6a6", "#1fb6d6"] },
  { id: "violet", label: "Violet", swatch: ["#a78bfa", "#6366f1"] },
  { id: "sunset", label: "Sunset", swatch: ["#ff8a4c", "#f43f5e"] },
  { id: "ocean", label: "Ocean", swatch: ["#38bdf8", "#2563eb"] },
  { id: "rose", label: "Rose", swatch: ["#fb7185", "#d946ef"] },
  { id: "gold", label: "Gold", swatch: ["#fbbf24", "#f97316"] },
];

interface ThemeState {
  theme: string;
  setTheme: (id: string) => void;
}

const apply = (id: string) => {
  if (typeof document === "undefined") return;
  if (id === "emerald") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = id;
};

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "emerald",
      setTheme: (theme) => {
        apply(theme);
        set({ theme });
      },
    }),
    {
      name: "resonance.theme",
      onRehydrateStorage: () => (state) => state && apply(state.theme),
    },
  ),
);

export const THEME_INIT_SCRIPT = `try{var t=JSON.parse(localStorage.getItem("resonance.theme")||"{}").state;if(t&&t.theme&&t.theme!=="emerald")document.documentElement.dataset.theme=t.theme}catch(e){}`;
