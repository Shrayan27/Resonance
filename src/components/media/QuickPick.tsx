"use client";

import { Pause, Play } from "lucide-react";
import type { Track } from "@/lib/types";
import { cn } from "@/lib/utils";
import { selectCurrentTrack, usePlayer } from "@/stores/player";
import { Artwork } from "./Artwork";

/** Compact horizontal tile used in the Home "quick picks" grid. */
export function QuickPick({ track, context }: { track: Track; context: Track[] }) {
  const playTrack = usePlayer((s) => s.playTrack);
  const toggle = usePlayer((s) => s.toggle);
  const isCurrent = usePlayer((s) => selectCurrentTrack(s)?.id === track.id);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playing = isCurrent && isPlaying;

  return (
    <button
      type="button"
      onClick={() => (isCurrent ? toggle() : playTrack(track, context))}
      aria-label={`${playing ? "Pause" : "Play"} ${track.title} by ${track.artist.name}`}
      className="group flex h-14 min-w-0 items-center gap-3 overflow-hidden rounded-md bg-white/8 pr-3 text-left transition-colors outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-ring sm:h-16"
    >
      <Artwork src={track.artwork} className="size-14 rounded-none rounded-l-md sm:size-16" />
      <span className={cn("min-w-0 flex-1 truncate text-sm font-bold", isCurrent && "text-brand")}>{track.title}</span>
      <span
        aria-hidden
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/40 transition-opacity",
          playing ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
          "max-sm:hidden",
        )}
      >
        {playing ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4 translate-x-px" fill="currentColor" />}
      </span>
    </button>
  );
}
