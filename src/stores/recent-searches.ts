"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RecentSearchType = "query" | "artist" | "track" | "playlist";

export interface RecentSearchItem {
  id: string;
  type: RecentSearchType;
  query: string;
  title: string;
  subtitle?: string;
  image?: string;
  targetUrl: string;
  timestamp: number;
}

interface RecentSearchesState {
  items: RecentSearchItem[];
  addSearch: (itemOrQuery: string | Omit<RecentSearchItem, "timestamp">) => void;
  removeSearch: (id: string) => void;
  clearAll: () => void;
}

export const useRecentSearches = create<RecentSearchesState>()(
  persist(
    (set) => ({
      items: [],
      addSearch: (itemOrQuery) => {
        set((state) => {
          let newItem: RecentSearchItem;
          if (typeof itemOrQuery === "string") {
            const trimmed = itemOrQuery.trim();
            if (!trimmed) return state;
            newItem = {
              id: `query:${trimmed.toLowerCase()}`,
              type: "query",
              query: trimmed,
              title: trimmed,
              subtitle: "Recent search",
              targetUrl: `/search?q=${encodeURIComponent(trimmed)}`,
              timestamp: Date.now(),
            };
          } else {
            if (!itemOrQuery.title?.trim()) return state;
            newItem = {
              ...itemOrQuery,
              timestamp: Date.now(),
            };
          }

          // Deduplicate
          const filtered = (state.items || []).filter((item) => {
            if (item.id === newItem.id) return false;
            if (item.type === "query" && newItem.type === "query") {
              return item.title.toLowerCase() !== newItem.title.toLowerCase();
            }
            if (item.targetUrl && newItem.targetUrl) {
              return item.targetUrl !== newItem.targetUrl;
            }
            return true;
          });

          // Keep up to 15 recent items
          return {
            items: [newItem, ...filtered].slice(0, 15),
          };
        });
      },
      removeSearch: (id) => {
        set((state) => ({
          items: (state.items || []).filter((item) => item.id !== id),
        }));
      },
      clearAll: () => set({ items: [] }),
    }),
    {
      name: "resonance_recent_searches",
    },
  ),
);
