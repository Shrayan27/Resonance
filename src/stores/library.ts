"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Collection, Track, UserPlaylist } from "@/lib/types";

interface LibraryState {
  liked: Track[];
  playlists: UserPlaylist[];
  savedCollections: Collection[];

  isLiked: (trackId: string) => boolean;
  toggleLike: (track: Track) => void;
  createPlaylist: (name: string, firstTrack?: Track) => UserPlaylist;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, track: Track) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  toggleSaveCollection: (c: Collection) => void;
  isCollectionSaved: (id: string) => boolean;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      liked: [],
      playlists: [],
      savedCollections: [],

      isLiked: (id) => get().liked.some((t) => t.id === id),
      toggleLike: (track) =>
        set((s) => ({
          liked: s.liked.some((t) => t.id === track.id)
            ? s.liked.filter((t) => t.id !== track.id)
            : [track, ...s.liked],
        })),
      createPlaylist: (name, firstTrack) => {
        const pl: UserPlaylist = {
          id: uid(),
          name: name.trim() || `My Playlist #${get().playlists.length + 1}`,
          trackIds: firstTrack ? [firstTrack.id] : [],
          tracks: firstTrack ? [firstTrack] : [],
          createdAt: Date.now(),
        };
        set((s) => ({ playlists: [pl, ...s.playlists] }));
        return pl;
      },
      renamePlaylist: (id, name) =>
        set((s) => ({ playlists: s.playlists.map((p) => (p.id === id ? { ...p, name } : p)) })),
      deletePlaylist: (id) => set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) })),
      addToPlaylist: (pid, track) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === pid && !p.trackIds.includes(track.id)
              ? { ...p, trackIds: [...p.trackIds, track.id], tracks: [...p.tracks, track] }
              : p,
          ),
        })),
      removeFromPlaylist: (pid, tid) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === pid
              ? { ...p, trackIds: p.trackIds.filter((i) => i !== tid), tracks: p.tracks.filter((t) => t.id !== tid) }
              : p,
          ),
        })),
      toggleSaveCollection: (c) =>
        set((s) => ({
          savedCollections: s.savedCollections.some((x) => x.id === c.id)
            ? s.savedCollections.filter((x) => x.id !== c.id)
            : [c, ...s.savedCollections],
        })),
      isCollectionSaved: (id) => get().savedCollections.some((c) => c.id === id),
    }),
    { name: "resonance.library" },
  ),
);
