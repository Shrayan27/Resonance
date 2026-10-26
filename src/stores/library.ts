"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Collection, Track, UserPlaylist } from "@/lib/types";

interface LibraryState {
  liked: Track[];
  history: Track[];
  playlists: UserPlaylist[];
  savedCollections: Collection[];

  isLiked: (trackId: string) => boolean;
  toggleLike: (track: Track) => void;
  recordPlay: (track: Track) => void;
  createPlaylist: (name: string, firstTrack?: Track, isPublic?: boolean) => UserPlaylist;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, track: Track) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  toggleSaveCollection: (c: Collection) => void;
  isCollectionSaved: (id: string) => boolean;
  syncPlaylists: () => Promise<void>;
  resetForUser: () => void;
}

const uid = () => `pl_${Math.random().toString(36).slice(2, 10)}`;

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      liked: [],
      history: [],
      playlists: [],
      savedCollections: [],

      isLiked: (id) => get().liked.some((t) => t.id === id),
      toggleLike: (track) => {
        set((s) => ({
          liked: s.liked.some((t) => t.id === track.id)
            ? s.liked.filter((t) => t.id !== track.id)
            : [track, ...s.liked],
        }));

        if (typeof window !== "undefined") {
          fetch("/api/user/liked", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ track }),
          }).catch(() => {});
        }
      },
      recordPlay: (track) => {
        if (typeof window !== "undefined") {
          import("./auth").then((m) => m.useAuth.getState().recordListen(track));
          import("./recent-searches").then((m) => m.useRecentSearches.getState().addTrack(track));
        }
        set((s) => {
          const prev = s.history || [];
          const filtered = prev.filter((t) => t.id !== track.id);
          return { history: [track, ...filtered].slice(0, 50) };
        });
      },
      createPlaylist: (name, firstTrack, isPublic = true) => {
        const tempId = uid();
        const pl: UserPlaylist = {
          id: tempId,
          name: name.trim() || `My Playlist #${get().playlists.length + 1}`,
          isPublic,
          trackIds: firstTrack ? [firstTrack.id] : [],
          tracks: firstTrack ? [firstTrack] : [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((s) => ({ playlists: [pl, ...s.playlists] }));

        if (typeof window !== "undefined") {
          fetch("/api/user/playlists", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: pl.name,
              firstTrack,
              isPublic,
            }),
          })
            .then(async (res) => {
              if (res.ok) {
                const data = await res.json();
                if (data.playlist) {
                  set((s) => ({
                    playlists: s.playlists.map((p) => (p.id === tempId ? data.playlist : p)),
                  }));
                }
              }
            })
            .catch(() => {});
        }

        return pl;
      },
      renamePlaylist: (id, name) => {
        const trimmed = name.trim();
        set((s) => ({
          playlists: s.playlists.map((p) => (p.id === id ? { ...p, name: trimmed } : p)),
        }));

        if (typeof window !== "undefined") {
          fetch(`/api/user/playlists/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: trimmed }),
          }).catch(() => {});
        }
      },
      deletePlaylist: (id) => {
        set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) }));

        if (typeof window !== "undefined") {
          fetch(`/api/user/playlists/${id}`, { method: "DELETE" }).catch(() => {});
        }
      },
      addToPlaylist: (pid, track) => {
        let updatedTracks: Track[] = [];
        set((s) => {
          const updated = s.playlists.map((p) => {
            if (p.id === pid && !p.trackIds.includes(track.id)) {
              updatedTracks = [...p.tracks, track];
              return {
                ...p,
                trackIds: [...p.trackIds, track.id],
                tracks: updatedTracks,
                updatedAt: Date.now(),
              };
            }
            if (p.id === pid) updatedTracks = p.tracks;
            return p;
          });
          return { playlists: updated };
        });

        if (typeof window !== "undefined" && updatedTracks.length > 0) {
          fetch(`/api/user/playlists/${pid}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tracks: updatedTracks }),
          }).catch(() => {});
        }
      },
      removeFromPlaylist: (pid, tid) => {
        let updatedTracks: Track[] = [];
        set((s) => {
          const updated = s.playlists.map((p) => {
            if (p.id === pid) {
              updatedTracks = p.tracks.filter((t) => t.id !== tid);
              return {
                ...p,
                trackIds: p.trackIds.filter((i) => i !== tid),
                tracks: updatedTracks,
                updatedAt: Date.now(),
              };
            }
            return p;
          });
          return { playlists: updated };
        });

        if (typeof window !== "undefined") {
          fetch(`/api/user/playlists/${pid}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tracks: updatedTracks }),
          }).catch(() => {});
        }
      },
      toggleSaveCollection: (c) =>
        set((s) => ({
          savedCollections: s.savedCollections.some((x) => x.id === c.id)
            ? s.savedCollections.filter((x) => x.id !== c.id)
            : [c, ...s.savedCollections],
        })),
      isCollectionSaved: (id) => get().savedCollections.some((c) => c.id === id),

      syncPlaylists: async () => {
        if (typeof window === "undefined") return;
        try {
          const [plRes, likedRes] = await Promise.all([
            fetch("/api/user/playlists", { cache: "no-store" }),
            fetch("/api/user/liked", { cache: "no-store" }),
          ]);
          if (plRes.ok) {
            const data = await plRes.json();
            if (Array.isArray(data.playlists) && data.playlists.length > 0) {
              set({ playlists: data.playlists });
            }
          }
          if (likedRes.ok) {
            const data = await likedRes.json();
            if (Array.isArray(data.liked) && data.liked.length > 0) {
              set({ liked: data.liked });
            }
          }
        } catch {}
      },

      resetForUser: () => {
        set({ playlists: [], liked: [] });
      },
    }),
    { name: "resonance.library" },
  ),
);
