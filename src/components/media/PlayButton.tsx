"use client";

import { Pause, Play } from "lucide-react";
import { usePlayer } from "@/stores/player";
import type { Track } from "@/lib/types";
import { cn } from "@/lib/utils";

export function sameTrackList(a: Track[], b: Track[]): boolean {
  if (a === b) return true;
  if (!a.length || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i].id !== b[i].id) return false;
  return true;
}

interface PlayButtonProps {
  tracks: Track[];
  /** Accessible subject, e.g. the playlist name. */
  label?: string;
  size?: "md" | "lg";
  className?: string;
}

/** Big round accent button: plays `tracks`, or toggles playback when they're already the active queue. */
export function PlayButton({ tracks, label, size = "lg", className }: PlayButtonProps) {
  const active = usePlayer((s) => sameTrackList(s.queue, tracks));
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playQueue = usePlayer((s) => s.playQueue);
  const toggle = usePlayer((s) => s.toggle);
  const playing = active && isPlaying;
  const empty = tracks.length === 0;

  return (
    <button
      type="button"
      disabled={empty}
      aria-label={`${playing ? "Pause" : "Play"}${label ? ` ${label}` : ""}`}
      onClick={() => (active ? toggle() : playQueue(tracks, 0))}
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/30 transition-transform outline-none hover:scale-105 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-100 disabled:pointer-events-none disabled:opacity-40",
        size === "lg" ? "size-14" : "size-11",
        className,
      )}
    >
      {playing ? (
        <Pause className={size === "lg" ? "size-6" : "size-5"} fill="currentColor" aria-hidden />
      ) : (
        <Play className={cn("translate-x-px", size === "lg" ? "size-6" : "size-5")} fill="currentColor" aria-hidden />
      )}
    </button>
  );
}
