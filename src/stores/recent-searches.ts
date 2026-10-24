"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Artist, ArtistRef, Collection, Track } from "@/lib/types";

export type RecentSearchType = "track" | "artist" | "album" | "playlist";

export interface RecentSearchItem {
  id: string;
  type: RecentSearchType;
  title: string;
  subtitle: string;
  image?: string;
  targetUrl: string;
  timestamp: number;
  trackData?: Track;
}

interface RecentSearchesState {
  items: RecentSearchItem[];
  addTrack: (track: Track) => void;
  addArtist: (artist: Artist | ArtistRef | { id: string; name: string; image?: string; imageLarge?: string }) => void;
  addAlbum: (album: Collection) => void;
  addPlaylist: (playlist: Collection) => void;
  addItem: (item: Omit<RecentSearchItem, "timestamp">) => void;
  removeSearch: (id: string) => void;
  clearAll: () => void;
}

export const useRecentSearches = create<RecentSearchesState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) => {
        if (!item.id || !item.title) return;
        set((state) => {
          const newItem: RecentSearchItem = {
            ...item,
            timestamp: Date.now(),
          };
          const filtered = (state.items || []).filter(
            (i) => i.id !== item.id && i.targetUrl !== item.targetUrl
          );
          return {
            items: [newItem, ...filtered].slice(0, 20),
          };
        });
      },

      addTrack: (track: Track) => {
        if (!track?.id || !track.title) return;
        const artistName = track.artist?.name || "Unknown Artist";
        set((state) => {
          const newItem: RecentSearchItem = {
            id: `track:${track.id}`,
            type: "track",
            title: track.title,
            subtitle: `Song • ${artistName}`,
            image: track.artworkLarge || track.artwork,
            targetUrl: `/search?q=${encodeURIComponent(track.title)}`,
            timestamp: Date.now(),
            trackData: track,
          };
          const filtered = (state.items || []).filter((i) => i.id !== newItem.id);
          return {
            items: [newItem, ...filtered].slice(0, 20),
          };
        });
      },

      addArtist: (artist: Artist | ArtistRef | { id: string; name: string; image?: string; imageLarge?: string }) => {
        if (!artist?.id || !artist.name) return;
        const img = "imageLarge" in artist && artist.imageLarge ? artist.imageLarge : "image" in artist ? artist.image : undefined;
        set((state) => {
          const newItem: RecentSearchItem = {
            id: `artist:${artist.id}`,
            type: "artist",
            title: artist.name,
            subtitle: "Artist",
            image: img,
            targetUrl: `/artist/${artist.id}`,
            timestamp: Date.now(),
          };
          const filtered = (state.items || []).filter((i) => i.id !== newItem.id);
          return {
            items: [newItem, ...filtered].slice(0, 20),
          };
        });
      },

      addAlbum: (album: Collection) => {
        if (!album?.id || !album.title) return;
        const ownerName = album.owner?.name ? ` • ${album.owner.name}` : "";
        set((state) => {
          const newItem: RecentSearchItem = {
            id: `album:${album.id}`,
            type: "album",
            title: album.title,
            subtitle: `Album${ownerName}`,
            image: album.artworkLarge || album.artwork,
            targetUrl: `/playlist/${album.id}`,
            timestamp: Date.now(),
          };
          const filtered = (state.items || []).filter((i) => i.id !== newItem.id);
          return {
            items: [newItem, ...filtered].slice(0, 20),
          };
        });
      },

      addPlaylist: (playlist: Collection) => {
        if (!playlist?.id || !playlist.title) return;
        const ownerName = playlist.owner?.name ? ` • ${playlist.owner.name}` : "";
        set((state) => {
          const newItem: RecentSearchItem = {
            id: `playlist:${playlist.id}`,
            type: "playlist",
            title: playlist.title,
            subtitle: `Playlist${ownerName}`,
            image: playlist.artworkLarge || playlist.artwork,
            targetUrl: `/playlist/${playlist.id}`,
            timestamp: Date.now(),
          };
          const filtered = (state.items || []).filter((i) => i.id !== newItem.id);
          return {
            items: [newItem, ...filtered].slice(0, 20),
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
      // Clean up any legacy "query" type items from localStorage
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.items)) {
          state.items = state.items.filter(
            (item) => item.type === "track" || item.type === "artist" || item.type === "album" || item.type === "playlist"
          );
        }
      },
    },
  ),
);
