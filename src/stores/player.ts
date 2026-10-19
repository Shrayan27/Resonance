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
  panel: "none" | "nowPlaying" | "queue";

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
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  enqueue: (track: Track) => void;
  playNext: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  jumpTo: (index: number) => void;
  setPanel: (panel: PlayerState["panel"]) => void;
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

      playQueue: (tracks, startIndex = 0) =>
        set({ queue: tracks, index: tracks.length ? startIndex : -1, isPlaying: tracks.length > 0, position: 0, error: null }),
      playTrack: (track, context) => {
        const queue = context && context.length ? context : [track];
        const index = Math.max(0, queue.findIndex((t) => t.id === track.id));
        set({ queue, index, isPlaying: true, position: 0, error: null });
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
        set({ isPlaying: false, position: 0 });
      },
      previous: () => {
        const { index, position, queue } = get();
        if (!queue.length) return;
        if (position > 3 || index <= 0) return get().seek(0);
        set({ index: index - 1, position: 0, isPlaying: true });
      },
      seek: (to) => set({ seekRequest: { to, nonce: Date.now() }, position: to }),
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
