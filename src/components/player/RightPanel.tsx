"use client";

import Link from "next/link";
import { Headphones, ListMusic, Music2, Sparkles, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCount, formatTime } from "@/lib/format";
import { selectCurrentTrack, usePlayer } from "@/stores/player";
import type { Track } from "@/lib/types";
import { Equalizer } from "./shared";

import { LyricsView } from "./LyricsView";
import { ArtistPanelView } from "./ArtistPanelView";

function PanelHeader({
  panel,
  setPanel,
  onClose,
}: {
  panel: "nowPlaying" | "lyrics" | "queue" | "artist";
  setPanel: (p: "nowPlaying" | "lyrics" | "queue" | "artist") => void;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 px-3 pt-3 pb-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setPanel("nowPlaying")}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors outline-none",
            panel === "nowPlaying" ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5",
          )}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setPanel("artist")}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors outline-none",
            panel === "artist" ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5",
          )}
        >
          Artist
        </button>
        <button
          type="button"
          onClick={() => setPanel("lyrics")}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors outline-none",
            panel === "lyrics" ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5",
          )}
        >
          Lyrics
        </button>
        <button
          type="button"
          onClick={() => setPanel("queue")}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors outline-none",
            panel === "queue" ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5",
          )}
        >
          Queue
        </button>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close panel"
        title="Close"
        className="inline-flex size-7 items-center justify-center rounded-full text-zinc-400 transition-colors outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-brand/70"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function Artwork({ track, className }: { track: Track; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote catalog artwork with unknown hosts
    <img src={track.artworkLarge || track.artwork} alt={`${track.title} artwork`} className={cn("rounded-lg bg-white/5 object-cover", className)} />
  );
}

function EmptyState({ icon: Icon, title, hint }: { icon: typeof Music2; title: string; hint: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 pb-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-white/5 text-zinc-400">
        <Icon className="size-6" />
      </div>
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="text-xs text-zinc-400">{hint}</p>
    </div>
  );
}

function NowPlaying() {
  const track = usePlayer(selectCurrentTrack);
  const openArtistPanel = usePlayer((s) => s.openArtistPanel);
  if (!track) {
    return <EmptyState icon={Music2} title="Nothing playing" hint="Pick something to play and it will show up here." />;
  }
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
      <Artwork track={track} className="aspect-square w-full shadow-2xl shadow-black/50" />
      <h3 className="mt-5 text-2xl leading-tight font-bold text-white">{track.title}</h3>
      <div className="mt-1 flex items-center justify-between">
        <Link
          href={`/artist/${track.artist.id}`}
          className="inline-block text-sm text-zinc-300 hover:text-white hover:underline focus-visible:underline"
        >
          {track.artist.name}
        </Link>
        <button
          type="button"
          onClick={() => openArtistPanel(track.artist)}
          className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
        >
          <span>All songs</span>
        </button>
      </div>
      <dl className="mt-5 grid gap-2 rounded-lg bg-white/5 p-3 text-sm">
        {track.album && (
          <div className="flex items-center gap-2 text-zinc-300">
            <Music2 className="size-4 shrink-0 text-zinc-500" />
            <dt className="sr-only">Album</dt>
            <dd className="truncate">{track.album}</dd>
          </div>
        )}
        {track.playCount !== undefined && (
          <div className="flex items-center gap-2 text-zinc-300">
            <Headphones className="size-4 shrink-0 text-zinc-500" />
            <dt className="sr-only">Plays</dt>
            <dd>{formatCount(track.playCount)} plays</dd>
          </div>
        )}
        {track.genre && (
          <div className="flex items-center gap-2 text-zinc-300">
            <Tag className="size-4 shrink-0 text-zinc-500" />
            <dt className="sr-only">Genre</dt>
            <dd className="truncate">{track.genre}</dd>
          </div>
        )}
        <div className="flex items-center gap-2 text-zinc-300">
          <ListMusic className="size-4 shrink-0 text-zinc-500" />
          <dt className="sr-only">Length</dt>
          <dd>{formatTime(track.durationSec)}</dd>
        </div>
      </dl>
    </div>
  );
}

function QueueRow({ track, index, current, isPlaying }: { track: Track; index: number; current: boolean; isPlaying: boolean }) {
  const jumpTo = usePlayer((s) => s.jumpTo);
  const remove = usePlayer((s) => s.removeFromQueue);
  return (
    <li className="group/row relative">
      <button
        type="button"
        onClick={() => jumpTo(index)}
        aria-label={`Play ${track.title} by ${track.artist.name}`}
        className={cn(
          "flex w-full items-center gap-3 rounded-md p-2 pr-10 text-left transition-colors outline-none hover:bg-white/8 focus-visible:ring-2 focus-visible:ring-brand/70",
          current && "bg-white/5",
        )}
      >
        <div className="relative size-10 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote catalog artwork with unknown hosts */}
          <img src={track.artwork} alt="" className="size-10 rounded bg-white/5 object-cover" />
          {current && (
            <span className="absolute inset-0 flex items-center justify-center rounded bg-black/50">
              <Equalizer active={isPlaying} />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-sm font-medium", current ? "text-brand" : "text-white")}>{track.title}</p>
          <p className="truncate text-xs text-zinc-400">{track.artist.name}</p>
        </div>
      </button>
      {!current && (
        <button
          type="button"
          onClick={() => remove(index)}
          aria-label={`Remove ${track.title} from queue`}
          title="Remove from queue"
          className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 opacity-0 transition-opacity outline-none group-hover/row:opacity-100 hover:bg-white/10 hover:text-white focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-brand/70 max-lg:opacity-100"
        >
          <X className="size-4" />
        </button>
      )}
    </li>
  );
}

function Queue() {
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const isPlaying = usePlayer((s) => s.isPlaying);

  if (queue.length === 0 || index < 0) {
    return <EmptyState icon={ListMusic} title="Your queue is empty" hint="Add tracks with “Add to queue” or start playing a playlist." />;
  }
  const current = queue[index];
  const upNext = queue.slice(index + 1).map((track, i) => ({ track, i: index + 1 + i }));
  const earlier = queue.slice(0, index).map((track, i) => ({ track, i }));

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-6">
      <div className="mx-2 my-2 flex items-center justify-between rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-zinc-300">
        <div className="flex items-center gap-1.5 truncate">
          <Sparkles className="size-3.5 text-brand shrink-0" />
          <span className="truncate">
            Smart Radio: <span className="text-white font-medium">{current.genre ? `${current.genre.toUpperCase()} & ` : ""}{current.artist.name} Mix</span>
          </span>
        </div>
      </div>
      <h3 className="px-2 pt-2 pb-1 text-xs font-semibold tracking-wider text-zinc-400 uppercase">Now playing</h3>
      <ul>
        <QueueRow track={current} index={index} current isPlaying={isPlaying} />
      </ul>
      <h3 className="px-2 pt-4 pb-1 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
        Next up {upNext.length > 0 && <span className="font-normal text-zinc-500">({upNext.length})</span>}
      </h3>
      {upNext.length > 0 ? (
        <ul>
          {upNext.map(({ track, i }) => (
            <QueueRow key={`${track.id}-${i}`} track={track} index={i} current={false} isPlaying={false} />
          ))}
        </ul>
      ) : (
        <p className="px-2 py-3 text-sm text-zinc-500">Autoplay will automatically queue similar songs...</p>
      )}
      {earlier.length > 0 && (
        <>
          <h3 className="px-2 pt-4 pb-1 text-xs font-semibold tracking-wider text-zinc-400 uppercase">Previously played</h3>
          <ul>
            {earlier.map(({ track, i }) => (
              <QueueRow key={`${track.id}-${i}`} track={track} index={i} current={false} isPlaying={false} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function RightPanel() {
  const panel = usePlayer((s) => s.panel);
  const setPanel = usePlayer((s) => s.setPanel);
  if (panel === "none") return null;
  const close = () => setPanel("none");

  const label =
    panel === "queue"
      ? "Queue"
      : panel === "lyrics"
        ? "Lyrics"
        : panel === "artist"
          ? "Artist"
          : "Now playing";

  const content = (
    <>
      <PanelHeader panel={panel} setPanel={setPanel} onClose={close} />
      {panel === "queue" ? (
        <Queue />
      ) : panel === "lyrics" ? (
        <LyricsView />
      ) : panel === "artist" ? (
        <ArtistPanelView />
      ) : (
        <NowPlaying />
      )}
    </>
  );

  return (
    <>
      {/* Desktop In-Grid Docked Panel (>= lg screens) */}
      <aside
        aria-label={label}
        className="hidden h-full w-[330px] xl:w-[370px] shrink-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0f1113] lg:flex"
      >
        {content}
      </aside>

      {/* Mobile & Tablet Overlay Drawer (< lg screens) */}
      <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm lg:hidden animate-in fade-in duration-200">
        <div
          className="fixed inset-0 -z-10"
          onClick={close}
          aria-label="Close backdrop"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className="relative z-10 flex h-[85dvh] max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-white/15 bg-[#0f1113] shadow-2xl sm:mx-auto sm:max-w-xl sm:rounded-2xl sm:border animate-in slide-in-from-bottom duration-300"
        >
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-white/20 sm:hidden" />
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            {content}
          </div>
        </div>
      </div>
    </>
  );
}
