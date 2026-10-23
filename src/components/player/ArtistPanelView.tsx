"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Heart, Music2, Pause, Play, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCount, formatTime } from "@/lib/format";
import { useArtist } from "@/lib/api";
import type { Track } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";
import { useLibrary } from "@/stores/library";
import { selectCurrentTrack, usePlayer } from "@/stores/player";
import { Equalizer } from "./shared";

function ArtistSongRow({
  track,
  allTracks,
}: {
  track: Track;
  allTracks: Track[];
}) {
  const currentTrack = usePlayer(selectCurrentTrack);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playTrack = usePlayer((s) => s.playTrack);
  const toggle = usePlayer((s) => s.toggle);
  const hydrated = useHydrated();
  const liked = useLibrary((s) => s.liked.some((t) => t.id === track.id));
  const toggleLike = useLibrary((s) => s.toggleLike);

  const isCurrent = currentTrack?.id === track.id;
  const isItemPlaying = isCurrent && isPlaying;
  const isLiked = hydrated && liked;

  const play = () => {
    if (isCurrent) {
      toggle();
    } else {
      playTrack(track, allTracks);
    }
  };

  return (
    <div
      role="row"
      onDoubleClick={play}
      className={cn(
        "group/item flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/10",
        isCurrent && "bg-white/5",
      )}
    >
      <div className="relative size-10 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={track.artwork || "/placeholder.png"}
          alt=""
          className="size-10 rounded-md bg-white/5 object-cover"
        />
        <button
          type="button"
          onClick={play}
          aria-label={`${isItemPlaying ? "Pause" : "Play"} ${track.title}`}
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-md bg-black/50 transition-opacity outline-none",
            isCurrent
              ? "opacity-100"
              : "opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100",
          )}
        >
          {isItemPlaying ? (
            <Equalizer active />
          ) : (
            <Play className="size-4 fill-white text-white" />
          )}
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium",
            isCurrent ? "text-brand" : "text-white",
          )}
          title={track.title}
        >
          {track.title}
        </p>
        <p className="truncate text-xs text-zinc-400">
          {track.album || track.artist.name}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label={isLiked ? "Unlike" : "Like"}
          onClick={() => toggleLike(track)}
          className={cn(
            "grid size-7 place-items-center rounded-full text-zinc-400 transition-opacity outline-none hover:text-white",
            isLiked ? "text-brand opacity-100" : "opacity-0 group-hover/item:opacity-100",
          )}
        >
          <Heart className="size-3.5" fill={isLiked ? "currentColor" : "none"} />
        </button>
        <span className="w-10 text-right text-xs text-zinc-500 tabular-nums">
          {formatTime(track.durationSec)}
        </span>
      </div>
    </div>
  );
}

export function ArtistPanelView() {
  const currentTrack = usePlayer(selectCurrentTrack);
  const selectedArtist = usePlayer((s) => s.selectedArtist);
  const playQueue = usePlayer((s) => s.playQueue);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const toggle = usePlayer((s) => s.toggle);

  const [query, setQuery] = useState("");

  const activeArtist = selectedArtist || (currentTrack ? currentTrack.artist : null);
  const { data, loading, error, retry } = useArtist(activeArtist?.id);

  const artist = data?.artist;
  const tracks = useMemo(() => data?.topTracks || [], [data?.topTracks]);

  const filteredTracks = useMemo(() => {
    if (!query.trim()) return tracks;
    const q = query.toLowerCase();
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.album && t.album.toLowerCase().includes(q)),
    );
  }, [tracks, query]);

  const isCurrentArtistPlaying =
    isPlaying && currentTrack && activeArtist && currentTrack.artist.id === activeArtist.id;

  if (!activeArtist) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-white/5 text-zinc-400">
          <User className="size-6" />
        </div>
        <p className="text-sm font-medium text-white">No artist selected</p>
        <p className="text-xs text-zinc-400">
          Play a song or search an artist to view their catalog here.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 overflow-hidden px-4 pt-4 pb-12 animate-pulse">
        <div className="size-32 self-center rounded-full bg-white/10" />
        <div className="h-6 w-1/2 self-center rounded-md bg-white/10" />
        <div className="h-4 w-1/3 self-center rounded-md bg-white/5" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="size-10 rounded-md bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-white/10" />
                <div className="h-3 w-1/2 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-12 text-center">
        <p className="text-sm font-medium text-white">Couldn&apos;t load artist</p>
        <button
          type="button"
          onClick={retry}
          className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Artist header banner */}
      <div className="relative shrink-0 border-b border-white/5 bg-linear-to-b from-white/10 to-transparent p-4 text-center">
        <div className="relative mx-auto mb-3 size-24 overflow-hidden rounded-full shadow-xl shadow-black/60 ring-2 ring-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={artist.imageLarge || artist.image || "/placeholder.png"}
            alt={artist.name}
            className="size-full object-cover"
          />
        </div>
        <h3 className="truncate text-xl font-bold text-white" title={artist.name}>
          {artist.name}
        </h3>
        <p className="mt-0.5 text-xs text-zinc-400">
          {formatCount(artist.followers)} followers · {tracks.length} songs
        </p>

        {/* Action buttons */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (isCurrentArtistPlaying) {
                toggle();
              } else if (tracks.length > 0) {
                playQueue(tracks, 0);
              }
            }}
            className="flex items-center gap-2 rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-black shadow-md transition-transform hover:scale-105 active:scale-95"
          >
            {isCurrentArtistPlaying ? (
              <>
                <Pause className="size-3.5 fill-black" /> Pause
              </>
            ) : (
              <>
                <Play className="size-3.5 fill-black" /> Play all
              </>
            )}
          </button>
          <Link
            href={`/artist/${artist.id}`}
            className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
          >
            <span>Full page</span>
            <ExternalLink className="size-3 text-zinc-400" />
          </Link>
        </div>

        {/* Search filter input inside artist tracks */}
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${artist.name}'s songs...`}
            className="h-8 w-full rounded-md border border-white/10 bg-white/5 pr-3 pl-8 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-brand/60 focus:bg-white/10"
          />
        </div>
      </div>

      {/* Songs list */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {filteredTracks.length > 0 ? (
          <div className="space-y-1">
            {filteredTracks.map((track) => (
              <ArtistSongRow
                key={track.id}
                track={track}
                allTracks={filteredTracks}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center text-xs text-zinc-500">
            <Music2 className="mb-2 size-6 opacity-40" />
            <p>No songs matching &ldquo;{query}&rdquo;</p>
          </div>
        )}
      </div>
    </div>
  );
}
