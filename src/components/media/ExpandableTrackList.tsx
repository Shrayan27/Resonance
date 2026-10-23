"use client";

import { useState } from "react";
import type { Track } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { TrackList } from "./TrackList";

interface Props {
  tracks: Track[];
  initial?: number;
  label?: string;
  hideHeader?: boolean;
  showPlays?: boolean;
  isSearch?: boolean;
}

/** Shows the first `initial` tracks (all of `tracks` stay the playback context) with a Show more toggle. */
export function ExpandableTrackList({ tracks, initial = 5, label, hideHeader, showPlays, isSearch }: Props) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? tracks : tracks.slice(0, initial);
  return (
    <div>
      <TrackList
        tracks={visible}
        contextTracks={isSearch ? undefined : tracks}
        isSearch={isSearch}
        label={label}
        hideHeader={hideHeader}
        showPlays={showPlays}
      />
      {tracks.length > initial && (
        <Button
          variant="ghost"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 h-9 rounded-full px-4 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          {expanded ? "Show less" : `Show ${tracks.length - initial} more`}
        </Button>
      )}
    </div>
  );
}
