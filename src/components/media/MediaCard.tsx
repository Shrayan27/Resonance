"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Loader2, Pause, Play } from "lucide-react";
import { Artwork } from "./Artwork";
import { fetchCollection } from "@/lib/api";
import type { Collection, Track } from "@/lib/types";
import { selectCurrentTrack, usePlayer } from "@/stores/player";
import { cn } from "@/lib/utils";

interface MediaCardProps {
  title: string;
  subtitle?: ReactNode;
  image?: string;
  /** Page the card links to. Without it the title acts as a play button. */
  href?: string;
  round?: boolean;
  /** Shows the pause glyph and keeps the button visible. */
  playing?: boolean;
  /** Highlights the title (current item). */
  active?: boolean;
  onPlay?: () => void | Promise<void>;
  playLabel?: string;
  className?: string;
  onClick?: () => void;
}

export function CardPlayButton({
  onPlay,
  playing,
  label,
  className,
}: {
  onPlay: () => void | Promise<void>;
  playing?: boolean;
  label: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setBusy(true);
        try {
          await onPlay();
        } finally {
          setBusy(false);
        }
      }}
      className={cn(
        "absolute right-2 bottom-2 z-20 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-black/50 transition-all duration-200 outline-none hover:scale-105 focus-visible:translate-y-0 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-foreground [@media(hover:hover)]:translate-y-2 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:translate-y-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100",
        playing && "translate-y-0 opacity-100 [@media(hover:hover)]:translate-y-0 [@media(hover:hover)]:opacity-100",
        className,
      )}
    >
      {busy ? (
        <Loader2 className="size-5 animate-spin" aria-hidden />
      ) : playing ? (
        <Pause className="size-5" fill="currentColor" aria-hidden />
      ) : (
        <Play className="size-5 translate-x-px" fill="currentColor" aria-hidden />
      )}
    </button>
  );
}

const stretch = "after:absolute after:inset-0 after:z-10 after:content-['']";

export function MediaCard({
  title,
  subtitle,
  image,
  href,
  round,
  playing,
  active,
  onPlay,
  playLabel,
  className,
  onClick,
}: MediaCardProps) {
  const titleClass = cn(
    "block truncate text-left text-sm font-semibold outline-none",
    stretch,
    "focus-visible:after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-ring",
    active ? "text-primary" : "text-foreground",
  );

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 rounded-lg bg-card/40 p-3 transition-colors hover:bg-card",
        className,
      )}
    >
      <div className="relative">
        <Artwork
          src={image}
          alt=""
          round={round}
          fallback={round ? "artist" : "track"}
          className={cn("w-full shadow-lg shadow-black/40", !round && "rounded-md")}
        />
        {onPlay && (
          <CardPlayButton
            onPlay={onPlay}
            playing={playing}
            label={`${playing ? "Pause" : "Play"} ${playLabel ?? title}`}
          />
        )}
      </div>
      <div className="min-w-0 space-y-0.5">
        {href ? (
          <Link href={href} onClick={onClick} className={titleClass}>
            {title}
          </Link>
        ) : (
          <button type="button" onClick={onPlay ? () => void onPlay() : undefined} className={cn(titleClass, "w-full")}>
            {title}
          </button>
        )}
        {subtitle && (
          <div className="relative z-20 line-clamp-2 min-h-8 text-[13px] leading-4 text-muted-foreground [&_a]:hover:text-foreground [&_a]:hover:underline">
            {subtitle}
          </div>
        )}
      </div>
    </article>
  );
}

/** Card for a single track; plays it within `context` (the shelf it sits in). */
export function TrackCard({ track, context, className }: { track: Track; context: Track[]; className?: string }) {
  const playTrack = usePlayer((s) => s.playTrack);
  const toggle = usePlayer((s) => s.toggle);
  const isCurrent = usePlayer((s) => selectCurrentTrack(s)?.id === track.id);
  const isPlaying = usePlayer((s) => s.isPlaying);
  return (
    <MediaCard
      className={className}
      title={track.title}
      image={track.artwork}
      active={isCurrent}
      playing={isCurrent && isPlaying}
      playLabel={`${track.title} by ${track.artist.name}`}
      onPlay={() => (isCurrent ? toggle() : playTrack(track, context))}
      subtitle={
        <Link href={`/artist/${track.artist.id}`} className="truncate">
          {track.artist.name}
        </Link>
      }
    />
  );
}

/** Card for a playlist or album; the play button loads its tracks and starts them. */
export function CollectionCard({ collection, className, onClick }: { collection: Collection; className?: string; onClick?: () => void }) {
  const playQueue = usePlayer((s) => s.playQueue);
  return (
    <MediaCard
      className={className}
      title={collection.title}
      href={`/playlist/${collection.id}`}
      image={collection.artwork}
      playLabel={collection.title}
      onClick={onClick}
      onPlay={async () => {
        onClick?.();
        const detail = await fetchCollection(collection.id);
        if (detail.tracks.length) playQueue(detail.tracks, 0);
      }}
      subtitle={
        <span className="truncate">
          {collection.kind === "album" ? "Album" : "Playlist"} · {collection.owner.name}
        </span>
      }
    />
  );
}
