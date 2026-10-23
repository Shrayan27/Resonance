"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Track } from "@/lib/types";

export type RepeatMode = "off" | "all" | "one";

interface PlayerState {
  queue: Track[];
  index: number;
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
  muted: boolean;
  /** Seconds. Written by the audio engine; read by the UI. */
  position: number;
  duration: number;
  buffering: boolean;
  error: string | null;
  /** Bumped to ask the audio engine to seek to `seekTo` seconds. */
  seekRequest: { to: number; nonce: number } | null;
  panel: "none" | "nowPlaying" | "queue" | "lyrics" | "artist";
  selectedArtist: { id: string; name: string } | null;

  /** Replace the queue with `tracks` and start at `startIndex` (default 0). */
  playQueue: (tracks: Track[], startIndex?: number) => void;
  /** Play one track, replacing the queue with `context` (or just the track). */
  playTrack: (track: Track, context?: Track[]) => void;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  seekBy: (delta: number) => void;
  playTrackWithSmartQueue: (track: Track, searchContext?: Track[]) => Promise<void>;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  enqueue: (track: Track) => void;
  playNext: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  jumpTo: (index: number) => void;
  setPanel: (panel: PlayerState["panel"]) => void;
  openArtistPanel: (artist: { id: string; name: string }) => void;
  setProgress: (position: number, duration: number) => void;
  setBuffering: (b: boolean) => void;
  setError: (e: string | null) => void;
}

export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: [],
      index: -1,
      isPlaying: false,
      shuffle: false,
      repeat: "off",
      volume: 0.7,
      muted: false,
      position: 0,
      duration: 0,
      buffering: false,
      error: null,
      seekRequest: null,
      panel: "none",
      selectedArtist: null,

      playQueue: (tracks, startIndex = 0) => {
        const { queue, isPlaying } = get();
        if (tracks.length && queue.length === tracks.length && queue.every((t, i) => t.id === tracks[i]?.id)) {
          set({ isPlaying: !isPlaying });
          return;
        }
        set({ queue: tracks, index: tracks.length ? startIndex : -1, isPlaying: tracks.length > 0, position: 0, error: null });
      },
      playTrackWithSmartQueue: async (track) => {
        const { queue, index, isPlaying } = get();
        const current = index >= 0 ? queue[index] : null;
        if (current && current.id === track.id) {
          set({ isPlaying: !isPlaying, error: null });
          return;
        }

        // 1. Immediately start playing ONLY the clicked song
        set({ queue: [track], index: 0, isPlaying: true, position: 0, error: null });

        // 2. Record to listening history
        try {
          const { useLibrary } = await import("./library");
          useLibrary.getState().recordPlay(track);
        } catch {
          // ignore
        }

        // 3. Fetch smart recommendations based on artist, genre, and taste
        try {
          const { fetchRecommendations } = await import("@/lib/api");
          const { useLibrary } = await import("./library");

          const recRes = await fetchRecommendations({
            artist: track.artist?.name,
            genre: track.genre,
            seedTitle: track.title,
            seedId: track.id,
            exclude: [track.id],
          });

          const recommendedTracks = recRes?.tracks || [];

          // Clean title helper for filtering out same-title variations (remix, slowed, instrumental)
          const clean = (s: string) =>
            s
              .toLowerCase()
              .replace(/\(.*?\)/g, "")
              .replace(/\[.*?\]/g, "")
              .replace(/[^a-z0-9]/g, "")
              .trim();
          const seedNorm = clean(track.title);

          // Exclude any track that matches the seed title or contains it
          const filteredRecs = recommendedTracks.filter((t) => {
            const tNorm = clean(t.title);
            if (!tNorm) return false;
            if (tNorm === seedNorm || tNorm.includes(seedNorm) || seedNorm.includes(tNorm)) return false;
            return true;
          });

          // 4. Merge user's taste from history/liked songs (different songs only)
          const lib = useLibrary.getState();
          const userTasteTracks = [...lib.liked, ...(lib.history || [])].filter((t) => {
            if (t.id === track.id) return false;
            const tNorm = clean(t.title);
            if (!tNorm || tNorm === seedNorm || tNorm.includes(seedNorm)) return false;
            const sameGenre = track.genre && t.genre && track.genre.toLowerCase() === t.genre.toLowerCase();
            const sameArtist =
              track.artist?.name && t.artist?.name && track.artist.name.toLowerCase() === t.artist.name.toLowerCase();
            return sameGenre || sameArtist;
          });

          const seen = new Set<string>([track.id]);
          const seenTitles = new Set<string>([seedNorm]);
          const merged: Track[] = [];

          // Blend up to 2 distinct songs from user's taste with top genre/artist hits
          const candidates = [...userTasteTracks.slice(0, 2), ...filteredRecs];
          for (const cand of candidates) {
            const tNorm = clean(cand.title);
            if (!seen.has(cand.id) && !seenTitles.has(tNorm)) {
              seen.add(cand.id);
              seenTitles.add(tNorm);
              merged.push(cand);
            }
          }

          // Append to queue if user is still on the same track
          const currentQueue = get().queue;
          if (get().index >= 0 && currentQueue[get().index]?.id === track.id) {
            set({ queue: [track, ...merged] });
          }
        } catch {
          // Fallback keeps [track]
        }
      },
      playTrack: (track, context) => {
        // Helper to detect repetitive titles (e.g. searching "winning speech" gives 10 tracks with "winning")
        const clean = (s: string) =>
          s
            .toLowerCase()
            .replace(/\(.*?\)/g, "")
            .replace(/\[.*?\]/g, "")
            .replace(/[^a-z0-9]/g, "")
            .trim();
        const seedNorm = clean(track.title);
        const repetitiveMatches = (context || []).filter((t) => {
          const tNorm = clean(t.title);
          return tNorm === seedNorm || tNorm.includes(seedNorm) || seedNorm.includes(tNorm);
        });

        // If no context, single track, or repetitive search results, activate smart recommendation queue!
        if (!context || context.length <= 1 || repetitiveMatches.length >= 2) {
          get().playTrackWithSmartQueue(track);
          return;
        }

        const { queue, index, isPlaying } = get();
        const current = index >= 0 ? queue[index] : null;
        if (current && current.id === track.id) {
          set({ isPlaying: !isPlaying, error: null });
          return;
        }
        const newQueue = context;
        const newIndex = Math.max(0, newQueue.findIndex((t) => t.id === track.id));
        set({ queue: newQueue, index: newIndex, isPlaying: true, position: 0, error: null });
      },
      toggle: () => set((s) => (s.index < 0 ? s : { isPlaying: !s.isPlaying })),
      play: () => set((s) => (s.index < 0 ? s : { isPlaying: true })),
      pause: () => set({ isPlaying: false }),
      next: () => {
        const { queue, index, repeat, shuffle } = get();
        if (!queue.length) return;
        if (shuffle && queue.length > 1) {
          let n = index;
          while (n === index) n = Math.floor(Math.random() * queue.length);
          return set({ index: n, position: 0, isPlaying: true });
        }
        if (index + 1 < queue.length) return set({ index: index + 1, position: 0, isPlaying: true });
        if (repeat === "all") return set({ index: 0, position: 0, isPlaying: true });

        // Continuous Autoplay when queue reaches end
        const current = queue[index];
        if (current) {
          import("@/lib/api").then(({ fetchRecommendations }) => {
            fetchRecommendations({
              artist: current.artist?.name,
              genre: current.genre,
              seedTitle: current.title,
              seedId: current.id,
              exclude: queue.map((t) => t.id),
            })
              .then((res) => {
                if (res.tracks?.length) {
                  set((s) => ({
                    queue: [...s.queue, ...res.tracks],
                    index: s.index + 1,
                    position: 0,
                    isPlaying: true,
                  }));
                } else {
                  set({ isPlaying: false, position: 0 });
                }
              })
              .catch(() => set({ isPlaying: false, position: 0 }));
          });
          return;
        }

        set({ isPlaying: false, position: 0 });
      },
      previous: () => {
        const { index, position, queue } = get();
        if (!queue.length) return;
        if (position > 3 || index <= 0) return get().seek(0);
        set({ index: index - 1, position: 0, isPlaying: true });
      },
      seek: (to) => set({ seekRequest: { to, nonce: Date.now() }, position: to }),
      seekBy: (delta) => {
        const { position, duration, queue, index } = get();
        const track = index >= 0 ? queue[index] : null;
        const max = duration > 0 ? duration : (track?.durationSec || Infinity);
        const target = Math.min(max, Math.max(0, position + delta));
        get().seek(target);
      },
      setVolume: (volume) => set({ volume, muted: false }),
      toggleMute: () => set((s) => ({ muted: !s.muted })),
      toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
      cycleRepeat: () =>
        set((s) => ({ repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off" })),
      enqueue: (track) =>
        set((s) => (s.index < 0 ? { queue: [track], index: 0, isPlaying: true } : { queue: [...s.queue, track] })),
      playNext: (track) =>
        set((s) => {
          if (s.index < 0) return { queue: [track], index: 0, isPlaying: true };
          const queue = [...s.queue];
          queue.splice(s.index + 1, 0, track);
          return { queue };
        }),
      removeFromQueue: (i) =>
        set((s) => {
          if (i === s.index) return s;
          const queue = s.queue.filter((_, k) => k !== i);
          return { queue, index: i < s.index ? s.index - 1 : s.index };
        }),
      jumpTo: (index) => set({ index, position: 0, isPlaying: true }),
      setPanel: (panel) => set({ panel }),
      openArtistPanel: (artist) => set({ selectedArtist: artist, panel: "artist" }),
      setProgress: (position, duration) => set({ position, duration }),
      setBuffering: (buffering) => set({ buffering }),
      setError: (error) => set({ error }),
    }),
    {
      name: "resonance.player",
      partialize: (s) => ({ volume: s.volume, shuffle: s.shuffle, repeat: s.repeat, muted: s.muted }),
    },
  ),
);

export const selectCurrentTrack = (s: Pick<PlayerState, "queue" | "index">): Track | null =>
  s.index >= 0 ? (s.queue[s.index] ?? null) : null;
