"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Heart,
  ListMusic,
  Loader2,
  MonitorSpeaker,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/format";
import { selectCurrentTrack, usePlayer } from "@/stores/player";
import { useLibrary } from "@/stores/library";
import { Tip, useHydrated } from "./shared";

const sliderStyle = cn(
  "group/slider py-2",
  "[&_[data-slot=slider-track]]:bg-white/15",
  "[&_[data-slot=slider-range]]:bg-linear-to-r [&_[data-slot=slider-range]]:from-emerald-400 [&_[data-slot=slider-range]]:to-teal-300",
  "[&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:border-0 [&_[data-slot=slider-thumb]]:opacity-0 [&_[data-slot=slider-thumb]]:shadow",
  "hover:[&_[data-slot=slider-thumb]]:opacity-100 focus-within:[&_[data-slot=slider-thumb]]:opacity-100 active:[&_[data-slot=slider-thumb]]:opacity-100",
  "[&_[data-slot=slider-track]]:transition-[height] hover:[&_[data-slot=slider-track]]:data-horizontal:h-1.5",
);

const iconBtn =
  "inline-flex size-9 items-center justify-center rounded-full text-zinc-400 transition-colors outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-400/70 disabled:pointer-events-none disabled:opacity-40";

function sliderNumber(v: number | readonly number[]): number {
  return Array.isArray(v) ? (v[0] ?? 0) : (v as number);
}

/** Interpolates the 4Hz engine position so the seek bar moves smoothly. */
function useSmoothPosition(): number {
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const buffering = usePlayer((s) => s.buffering);
  const [value, setValue] = useState(position);
  const base = useRef({ position, at: 0 });

  useEffect(() => {
    base.current = { position, at: performance.now() };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync derived display value with the store
    setValue(position);
    if (!isPlaying || buffering) return;
    let raf = 0;
    const tick = () => {
      const elapsed = (performance.now() - base.current.at) / 1000;
      const next = base.current.position + elapsed;
      setValue(duration > 0 ? Math.min(duration, next) : next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [position, duration, isPlaying, buffering]);

  return value;
}

function SeekBar({ disabled }: { disabled: boolean }) {
  const duration = usePlayer((s) => s.duration);
  const trackDuration = usePlayer((s) => selectCurrentTrack(s)?.durationSec ?? 0);
  const buffering = usePlayer((s) => s.buffering);
  const seek = usePlayer((s) => s.seek);
  const smooth = useSmoothPosition();
  const [drag, setDrag] = useState<number | null>(null);

  const total = duration > 0 ? duration : trackDuration;
  const shown = drag ?? (disabled ? 0 : smooth);

  return (
    <div className="flex w-full items-center gap-2 text-[11px] tabular-nums text-zinc-400">
      <span className="w-10 text-right" aria-label="Elapsed time">
        {formatTime(shown)}
      </span>
      <Slider
        aria-label="Seek"
        className={cn(sliderStyle, "flex-1", buffering && !disabled && "[&_[data-slot=slider-track]]:animate-pulse")}
        min={0}
        max={total > 0 ? total : 1}
        step={0.1}
        value={[Math.min(shown, total > 0 ? total : 1)]}
        disabled={disabled || total <= 0}
        onValueChange={(v) => setDrag(sliderNumber(v))}
        onValueCommitted={(v) => {
          seek(sliderNumber(v));
          setDrag(null);
        }}
      />
      <span className="w-10" aria-label="Total time">
        {formatTime(total)}
      </span>
    </div>
  );
}

function VolumeControl() {
  const hydrated = useHydrated();
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const setVolume = usePlayer((s) => s.setVolume);
  const toggleMute = usePlayer((s) => s.toggleMute);

  const effective = hydrated ? (muted ? 0 : volume) : 0.7;
  const Icon = effective === 0 ? VolumeX : effective < 0.5 ? Volume1 : Volume2;

  return (
    <div className="flex items-center gap-1">
      <Tip label={muted ? "Unmute (M)" : "Mute (M)"}>
        <button type="button" className={iconBtn} onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} aria-pressed={muted}>
          <Icon className="size-[18px]" />
        </button>
      </Tip>
      <Slider
        aria-label="Volume"
        className={cn(sliderStyle, "w-24")}
        min={0}
        max={1}
        step={0.01}
        value={[effective]}
        onValueChange={(v) => setVolume(sliderNumber(v))}
      />
    </div>
  );
}

function LikeButton({ className }: { className?: string }) {
  const track = usePlayer(selectCurrentTrack);
  const liked = useLibrary((s) => (track ? s.liked.some((t) => t.id === track.id) : false));
  const toggleLike = useLibrary((s) => s.toggleLike);
  if (!track) return null;
  return (
    <Tip label={liked ? "Remove from Liked Songs" : "Save to Liked Songs"}>
      <button
        type="button"
        className={cn(iconBtn, "size-8", liked && "text-emerald-400 hover:text-emerald-300", className)}
        aria-label={liked ? "Remove from Liked Songs" : "Save to Liked Songs"}
        aria-pressed={liked}
        onClick={() => toggleLike(track)}
      >
        <Heart className={cn("size-[18px]", liked && "fill-current")} />
      </button>
    </Tip>
  );
}

function PlayToggle({ size = "lg", disabled }: { size?: "lg" | "sm"; disabled: boolean }) {
  const isPlaying = usePlayer((s) => s.isPlaying);
  const buffering = usePlayer((s) => s.buffering);
  const toggle = usePlayer((s) => s.toggle);
  const label = isPlaying ? "Pause" : "Play";
  const Icon = isPlaying ? Pause : Play;
  const showSpinner = isPlaying && buffering;
  return (
    <Tip label={`${label} (Space)`}>
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-label={label}
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-white text-black shadow-md transition-transform outline-none hover:scale-105 focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95 disabled:pointer-events-none disabled:opacity-40",
          size === "lg" ? "size-10" : "size-9",
        )}
      >
        {showSpinner ? <Loader2 className="size-5 animate-spin" /> : <Icon className="size-5 fill-current" />}
      </button>
    </Tip>
  );
}

function TrackInfo({ compact }: { compact?: boolean }) {
  const track = usePlayer(selectCurrentTrack);
  const artSize = compact ? "size-11" : "size-14";
  if (!track) {
    return (
      <div className="flex min-w-0 items-center gap-3">
        <div className={cn(artSize, "shrink-0 rounded-md bg-white/5 ring-1 ring-white/10")} />
        <p className="truncate text-sm text-zinc-400">Pick something to play</p>
      </div>
    );
  }
  return (
    <div className="flex min-w-0 items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- remote catalog artwork with unknown hosts */}
      <img src={track.artwork} alt={`${track.title} artwork`} className={cn(artSize, "shrink-0 rounded-md bg-white/5 object-cover shadow-lg")} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white" title={track.title}>
          {track.title}
        </p>
        <Link
          href={`/artist/${track.artist.id}`}
          className="block truncate text-xs text-zinc-400 hover:text-white hover:underline focus-visible:text-white focus-visible:underline"
        >
          {track.artist.name}
        </Link>
      </div>
    </div>
  );
}

export function PlayerBar() {
  const hydrated = useHydrated();
  const hasTrack = usePlayer((s) => s.index >= 0);
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const panel = usePlayer((s) => s.panel);
  const error = usePlayer((s) => s.error);
  const next = usePlayer((s) => s.next);
  const previous = usePlayer((s) => s.previous);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);
  const setPanel = usePlayer((s) => s.setPanel);
  const progress = usePlayer((s) => (s.duration > 0 ? s.position / s.duration : 0));

  const shuffleOn = hydrated && shuffle;
  const repeatMode = hydrated ? repeat : "off";
  const RepeatIcon = repeatMode === "one" ? Repeat1 : Repeat;
  const repeatLabel = repeatMode === "off" ? "Enable repeat" : repeatMode === "all" ? "Repeat one" : "Disable repeat";
  const active = "text-emerald-400 hover:text-emerald-300";
  const dot = (
    <span aria-hidden="true" className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-emerald-400" />
  );

  return (
    <TooltipProvider delay={400}>
      <footer
        aria-label="Player"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0b0c0e]/95 text-white backdrop-blur-md"
      >
        {error && (
          <div
            role="status"
            className="absolute -top-9 left-1/2 max-w-[90vw] -translate-x-1/2 truncate rounded-full bg-amber-500/15 px-4 py-1.5 text-xs text-amber-200 ring-1 ring-amber-400/30"
          >
            {error}
          </div>
        )}

        <div className="relative md:hidden">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-white/10" aria-hidden="true">
            <div
              className="h-full bg-linear-to-r from-emerald-400 to-teal-300 transition-[width] duration-300 ease-linear"
              style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
            />
          </div>
          <div className="flex h-16 items-center gap-2 px-3">
            <div className="min-w-0 flex-1">
              <TrackInfo compact />
            </div>
            <LikeButton />
            <Tip label="Queue">
              <button
                type="button"
                className={cn(iconBtn, panel === "queue" && active)}
                aria-label="Queue"
                onClick={() => setPanel(panel === "queue" ? "none" : "queue")}
              >
                <ListMusic className="size-[18px]" />
              </button>
            </Tip>
            <PlayToggle size="sm" disabled={!hasTrack} />
          </div>
        </div>

        <div className="hidden h-[88px] grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] items-center gap-4 px-4 md:grid">
          <div className="flex min-w-0 items-center gap-1">
            <div className="min-w-0 flex-1">
              <TrackInfo />
            </div>
            <LikeButton />
          </div>

          <div className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-0.5">
            <div className="flex items-center gap-2">
              <Tip label={shuffleOn ? "Disable shuffle (S)" : "Enable shuffle (S)"}>
                <button
                  type="button"
                  className={cn(iconBtn, "relative", shuffleOn && active)}
                  aria-label={shuffleOn ? "Disable shuffle" : "Enable shuffle"}
                  aria-pressed={shuffleOn}
                  onClick={toggleShuffle}
                  disabled={!hasTrack}
                >
                  <Shuffle className="size-[18px]" />
                  {shuffleOn && dot}
                </button>
              </Tip>
              <Tip label="Previous (P)">
                <button type="button" className={iconBtn} aria-label="Previous" onClick={previous} disabled={!hasTrack}>
                  <SkipBack className="size-5 fill-current" />
                </button>
              </Tip>
              <PlayToggle disabled={!hasTrack} />
              <Tip label="Next (N)">
                <button type="button" className={iconBtn} aria-label="Next" onClick={next} disabled={!hasTrack}>
                  <SkipForward className="size-5 fill-current" />
                </button>
              </Tip>
              <Tip label={repeatLabel}>
                <button
                  type="button"
                  className={cn(iconBtn, "relative", repeatMode !== "off" && active)}
                  aria-label={repeatLabel}
                  aria-pressed={repeatMode !== "off"}
                  onClick={cycleRepeat}
                  disabled={!hasTrack}
                >
                  <RepeatIcon className="size-[18px]" />
                  {repeatMode !== "off" && dot}
                </button>
              </Tip>
            </div>
            <SeekBar disabled={!hasTrack} />
          </div>

          <div className="flex items-center justify-end gap-1">
            <Tip label="Now playing view">
              <button
                type="button"
                className={cn(iconBtn, panel === "nowPlaying" && active)}
                aria-label="Now playing view"
                aria-pressed={panel === "nowPlaying"}
                onClick={() => setPanel(panel === "nowPlaying" ? "none" : "nowPlaying")}
              >
                <MonitorSpeaker className="size-[18px]" />
              </button>
            </Tip>
            <Tip label="Queue">
              <button
                type="button"
                className={cn(iconBtn, panel === "queue" && active)}
                aria-label="Queue"
                aria-pressed={panel === "queue"}
                onClick={() => setPanel(panel === "queue" ? "none" : "queue")}
              >
                <ListMusic className="size-[18px]" />
              </button>
            </Tip>
            <VolumeControl />
          </div>
        </div>
      </footer>
    </TooltipProvider>
  );
}
