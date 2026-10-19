"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Track } from "@/lib/types";

interface ShellState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
}

export const useShell = create<ShellState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
    }),
    { name: "resonance.shell" },
  ),
);

interface CreateDialogState {
  open: boolean;
  /** Track added to the new playlist as its first entry, if any. */
  track?: Track;
  show: (track?: Track) => void;
  setOpen: (open: boolean) => void;
}

/** Global controller for the single CreatePlaylistDialog mounted in the app shell. */
export const useCreatePlaylistDialog = create<CreateDialogState>()((set) => ({
  open: false,
  track: undefined,
  show: (track) => set({ open: true, track }),
  setOpen: (open) => set(open ? { open } : { open: false, track: undefined }),
}));
