"use client";

import { Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Track } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TrackRow, trackGridClass } from "./TrackRow";

interface TrackListProps {
  tracks: Track[];
  /** Queue used when a row is played; defaults to `tracks`. */
  contextTracks?: Track[];
  /** Show the plays column. Defaults to true when any track has a play count. */
  showPlays?: boolean;
  onRemove?: (track: Track) => void;
  removeLabel?: string;
  /** Hide the column header (compact lists such as search results). */
  hideHeader?: boolean;
  className?: string;
  label?: string;
}

export function TrackList({ tracks, contextTracks, showPlays, onRemove, removeLabel, hideHeader, className, label = "Tracks" }: TrackListProps) {
  const plays = showPlays ?? tracks.some((t) => t.playCount != null);
  return (
    <div role="table" aria-label={label} aria-rowcount={tracks.length + 1} className={className}>
      {!hideHeader && (
        <div
          role="row"
          className={cn(
            "mb-1 grid h-9 items-center gap-x-3 border-b border-white/10 px-2 text-xs font-medium tracking-wider text-muted-foreground uppercase",
            trackGridClass(plays),
          )}
        >
          <div role="columnheader" className="text-center">
            #
          </div>
          <div role="columnheader">Title</div>
          {plays && (
            <div role="columnheader" className="hidden text-right md:block">
              Plays
            </div>
          )}
          <div role="columnheader">
            <span className="sr-only">Like</span>
          </div>
          <div role="columnheader" className="flex justify-end">
            <Clock className="size-4" aria-label="Duration" />
          </div>
          <div role="columnheader">
            <span className="sr-only">Actions</span>
          </div>
        </div>
      )}
      <div role="rowgroup">
        {tracks.map((track, i) => (
          <TrackRow
            key={`${track.id}-${i}`}
            track={track}
            index={i}
            tracks={contextTracks ?? tracks}
            showPlays={plays}
            onRemove={onRemove}
            removeLabel={removeLabel}
          />
        ))}
      </div>
    </div>
  );
}

export function TrackListSkeleton({ rows = 8, hideHeader }: { rows?: number; hideHeader?: boolean }) {
  return (
    <div aria-busy="true" aria-label="Loading tracks">
      {!hideHeader && <div className="mb-1 h-9 border-b border-white/10" />}
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex h-14 items-center gap-3 px-2">
          <Skeleton className="size-4 w-8 bg-neutral-800" />
          <Skeleton className="size-10 shrink-0 bg-neutral-800" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3 bg-neutral-800" />
            <Skeleton className="h-3 w-1/5 bg-neutral-800" />
          </div>
          <Skeleton className="h-3 w-10 bg-neutral-800" />
        </div>
      ))}
    </div>
  );
}
