"use client";

import Link from "next/link";
import { Headphones, ListMusic, Music2, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCount, formatTime } from "@/lib/format";
import { selectCurrentTrack, usePlayer } from "@/stores/player";
import type { Track } from "@/lib/types";
import { Equalizer } from "./shared";

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2">
      <h2 className="text-base font-semibold tracking-tight text-white">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close panel"
        title="Close"
        className="inline-flex size-8 items-center justify-center rounded-full text-zinc-400 transition-colors outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-brand/70"
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
  if (!track) {
    return <EmptyState icon={Music2} title="Nothing playing" hint="Pick something to play and it will show up here." />;
  }
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
      <Artwork track={track} className="aspect-square w-full shadow-2xl shadow-black/50" />
      <h3 className="mt-5 text-2xl leading-tight font-bold text-white">{track.title}</h3>
      <Link
        href={`/artist/${track.artist.id}`}
        className="mt-1 inline-block text-sm text-zinc-300 hover:text-white hover:underline focus-visible:underline"
      >
        {track.artist.name}
      </Link>
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
      <h3 className="px-2 pt-2 pb-1 text-xs font-semibold tracking-wider text-zinc-400 uppercase">Now playing</h3>
      <ul>
        <QueueRow track={current} index={index} current isPlaying={isPlaying} />
      </ul>
      <h3 className="px-2 pt-4 pb-1 text-xs font-semibold tracking-wider text-zinc-400 uppercase">Next up</h3>
      {upNext.length > 0 ? (
        <ul>
          {upNext.map(({ track, i }) => (
            <QueueRow key={`${track.id}-${i}`} track={track} index={i} current={false} isPlaying={false} />
          ))}
        </ul>
      ) : (
        <p className="px-2 py-3 text-sm text-zinc-500">Nothing queued after this track.</p>
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

  return (
    <aside
      aria-label={panel === "queue" ? "Queue" : "Now playing"}
      className="hidden h-full w-[340px] shrink-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0f1113] lg:flex"
    >
      <PanelHeader title={panel === "queue" ? "Queue" : "Now playing"} onClose={close} />
      {panel === "queue" ? <Queue /> : <NowPlaying />}
    </aside>
  );
}
