"use client";

import Link from "next/link";
import { memo, useRef } from "react";
import { Heart, ListEnd, ListPlus, ListStart, MoreHorizontal, Pause, Play, Trash2, User } from "lucide-react";
import { AddToPlaylistMenu } from "@/components/shell/AddToPlaylistMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCount, formatTime } from "@/lib/format";
import type { Track } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/stores/library";
import { useRecentSearches } from "@/stores/recent-searches";
import { selectCurrentTrack, usePlayer } from "@/stores/player";
import { Artwork } from "./Artwork";
import { Equalizer } from "./Equalizer";

export function trackGridClass(showPlays: boolean) {
  return showPlays
    ? "grid-cols-[1.75rem_minmax(0,1fr)_2rem_2rem] sm:grid-cols-[2rem_minmax(0,1fr)_2rem_3rem_2rem] md:grid-cols-[2rem_minmax(0,1fr)_6rem_2rem_3rem_2rem]"
    : "grid-cols-[1.75rem_minmax(0,1fr)_2rem_2rem] sm:grid-cols-[2rem_minmax(0,1fr)_2rem_3rem_2rem]";
}

interface TrackRowProps {
  track: Track;
  index: number;
  /** The list this row belongs to; becomes the queue when played. */
  tracks: Track[];
  showPlays?: boolean;
  isSearch?: boolean;
  /** Provide to show a "Remove" menu item (user playlists). */
  onRemove?: (track: Track) => void;
  removeLabel?: string;
}

function TrackRowImpl({ track, index, tracks, showPlays = false, isSearch = false, onRemove, removeLabel = "Remove from playlist" }: TrackRowProps) {
  const hydrated = useHydrated();
  const isCurrent = usePlayer((s) => selectCurrentTrack(s)?.id === track.id);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playTrack = usePlayer((s) => s.playTrack);
  const playTrackWithSmartQueue = usePlayer((s) => s.playTrackWithSmartQueue);
  const toggle = usePlayer((s) => s.toggle);
  const enqueue = usePlayer((s) => s.enqueue);
  const playNext = usePlayer((s) => s.playNext);
  const openArtistPanel = usePlayer((s) => s.openArtistPanel);
  const liked = useLibrary((s) => s.liked.some((t) => t.id === track.id));
  const toggleLike = useLibrary((s) => s.toggleLike);
  const playlistTrigger = useRef<HTMLButtonElement>(null);

  const playing = isCurrent && isPlaying;
  const isLiked = hydrated && liked;
  const play = () => {
    if (isCurrent) return toggle();
    if (isSearch) {
      useRecentSearches.getState().addTrack(track);
      return playTrackWithSmartQueue(track);
    }
    useRecentSearches.getState().addTrack(track);
    playTrack(track, tracks);
  };

  return (
    <div
      role="row"
      aria-label={`${track.title} by ${track.artist.name}`}
      data-current={isCurrent || undefined}
      onDoubleClick={() => (isSearch ? playTrackWithSmartQueue(track) : playTrack(track, tracks))}
      className={cn(
        "group/row grid h-14 items-center gap-x-2 sm:gap-x-3 rounded-md px-1.5 sm:px-2 text-sm transition-colors hover:bg-white/8 focus-within:bg-white/8",
        trackGridClass(showPlays),
      )}
    >
      <div role="cell" className="grid place-items-center">
        <button
          type="button"
          onClick={play}
          aria-label={`${playing ? "Pause" : "Play"} ${track.title}`}
          className={cn(
            "relative grid size-8 place-items-center rounded-sm text-muted-foreground tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isCurrent && "text-brand",
          )}
        >
          <span className="group-focus-within/row:hidden group-hover/row:hidden">
            {isCurrent ? <Equalizer playing={isPlaying} /> : index + 1}
          </span>
          <span className="hidden text-foreground group-focus-within/row:block group-hover/row:block">
            {playing ? (
              <Pause className="size-4" fill="currentColor" aria-hidden />
            ) : (
              <Play className="size-4" fill="currentColor" aria-hidden />
            )}
          </span>
        </button>
      </div>

      <div role="cell" className="flex min-w-0 items-center gap-3">
        <Artwork src={track.artwork} className="size-10" />
        <div className="min-w-0">
          <div className={cn("truncate font-medium", isCurrent ? "text-brand" : "text-foreground")}>{track.title}</div>
          <Link
            href={`/artist/${track.artist.id}`}
            onDoubleClick={(e) => e.stopPropagation()}
            className="block truncate rounded-sm text-[13px] text-muted-foreground outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            {track.artist.name}
          </Link>
        </div>
      </div>

      {showPlays && (
        <div role="cell" className="hidden text-right text-[13px] text-muted-foreground tabular-nums md:block">
          {track.playCount != null ? formatCount(track.playCount) : ""}
        </div>
      )}

      <div role="cell" className="grid place-items-center">
        <button
          type="button"
          aria-pressed={isLiked}
          aria-label={isLiked ? `Remove ${track.title} from Liked Songs` : `Save ${track.title} to Liked Songs`}
          onClick={() => toggleLike(track)}
          className={cn(
            "grid size-8 place-items-center rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
            isLiked
              ? "text-brand"
              : "text-muted-foreground opacity-0 group-focus-within/row:opacity-100 group-hover/row:opacity-100 hover:text-foreground focus-visible:opacity-100 [@media(hover:none)]:opacity-100",
          )}
        >
          <Heart className="size-4" fill={isLiked ? "currentColor" : "none"} aria-hidden />
        </button>
      </div>

      <div role="cell" className="hidden text-right text-[13px] text-muted-foreground tabular-nums sm:block">
        {formatTime(track.durationSec)}
      </div>

      <div role="cell" className="relative grid place-items-center">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`More options for ${track.title}`}
            onDoubleClick={(e) => e.stopPropagation()}
            className="grid size-8 place-items-center rounded-full text-muted-foreground outline-none transition hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring data-popup-open:text-foreground data-popup-open:opacity-100 group-focus-within/row:opacity-100 group-hover/row:opacity-100 opacity-0 [@media(hover:none)]:opacity-100"
          >
            <MoreHorizontal className="size-5" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem className="gap-2 py-2" onClick={() => playNext(track)}>
              <ListStart /> Play next
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 py-2" onClick={() => enqueue(track)}>
              <ListEnd /> Add to queue
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 py-2"
              onClick={() => setTimeout(() => playlistTrigger.current?.click(), 60)}
            >
              <ListPlus /> Add to playlist
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 py-2"
              onClick={() => openArtistPanel(track.artist)}
            >
              <User /> View artist alongside
            </DropdownMenuItem>
            {onRemove && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 py-2" variant="destructive" onClick={() => onRemove(track)}>
                  <Trash2 /> {removeLabel}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <AddToPlaylistMenu track={track}>
          <button
            ref={playlistTrigger}
            type="button"
            tabIndex={-1}
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0"
          />
        </AddToPlaylistMenu>
      </div>
    </div>
  );
}

export const TrackRow = memo(TrackRowImpl);
