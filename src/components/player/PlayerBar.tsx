"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Heart,
  ListMusic,
  Loader2,
  MicVocal,
  MonitorSpeaker,
  Pause,
  Play,
  Repeat,
  Repeat1,
  RotateCcw,
  RotateCw,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
  Sliders,
  Zap,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/format";
import { selectCurrentTrack, usePlayer } from "@/stores/player";
import { useLibrary } from "@/stores/library";
import { Tip, useHydrated } from "./shared";
import { VolumeHud } from "./VolumeHud";
import { EqualizerModal } from "./EqualizerModal";

const sliderStyle = cn(
  "group/slider py-2",
  "[&_[data-slot=slider-track]]:bg-white/15",
  "[&_[data-slot=slider-range]]:bg-linear-to-r [&_[data-slot=slider-range]]:from-brand [&_[data-slot=slider-range]]:to-brand-2",
  "[&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:border-0 [&_[data-slot=slider-thumb]]:opacity-0 [&_[data-slot=slider-thumb]]:shadow",
  "hover:[&_[data-slot=slider-thumb]]:opacity-100 focus-within:[&_[data-slot=slider-thumb]]:opacity-100 active:[&_[data-slot=slider-thumb]]:opacity-100",
  "[&_[data-slot=slider-track]]:transition-[height] hover:[&_[data-slot=slider-track]]:data-horizontal:h-1.5",
);

const iconBtn =
  "inline-flex size-9 items-center justify-center rounded-full text-zinc-400 transition-colors outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-brand/70 disabled:pointer-events-none disabled:opacity-40";

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

function VolumeControl({ compact = false }: { compact?: boolean }) {
  const hydrated = useHydrated();
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const setVolume = usePlayer((s) => s.setVolume);
  const changeVolumeBy = usePlayer((s) => s.changeVolumeBy);
  const toggleMute = usePlayer((s) => s.toggleMute);
  const setShowEqModal = usePlayer((s) => s.setShowEqModal);
  const eqPreset = usePlayer((s) => s.eqPreset);

  const effective = hydrated ? (muted ? 0 : volume) : 0.7;
  const percent = Math.round(effective * 100);
  const isBoosted = percent > 100;

  let Icon = Volume2;
  if (effective === 0) Icon = VolumeX;
  else if (isBoosted) Icon = Zap;
  else if (effective < 0.5) Icon = Volume1;

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    changeVolumeBy(e.deltaY < 0 ? 0.05 : -0.05);
  };

  return (
    <div className="flex items-center gap-1 group/vol" onWheel={onWheel}>
      <Tip
        label={
          muted
            ? "Unmute (M) · Double click for 100%"
            : `${percent}% · Click Mute (M) · Double click for 100%`
        }
      >
        <button
          type="button"
          className={cn(iconBtn, isBoosted && "text-amber-400 hover:text-amber-300")}
          onClick={toggleMute}
          onDoubleClick={() => setVolume(1.0, true)}
          aria-label={muted ? "Unmute" : "Mute"}
          aria-pressed={muted}
        >
          <Icon className="size-[18px]" />
        </button>
      </Tip>

      <div className="relative flex items-center">
        <Slider
          aria-label="Volume & Sound Boost"
          className={cn(
            sliderStyle,
            compact ? "w-20" : "w-24 md:w-28",
            isBoosted &&
              "[&_[data-slot=slider-range]]:bg-linear-to-r [&_[data-slot=slider-range]]:from-brand [&_[data-slot=slider-range]]:to-amber-400",
          )}
          min={0}
          max={2.0}
          step={0.01}
          value={[effective]}
          onValueChange={(v) => setVolume(sliderNumber(v), true)}
        />
        {/* 100% Standard Marker Notch */}
        <div
          title="100% Studio Standard Level"
          className="absolute left-1/2 top-1/2 -translate-y-1/2 w-0.5 h-2 bg-white/25 pointer-events-none rounded-full"
        />
      </div>

      <Tip label="Sound Enhancer & Studio EQ">
        <button
          type="button"
          className={cn(
            iconBtn,
            "size-8",
            eqPreset !== "flat" && "text-brand hover:text-brand-strong bg-brand/10",
          )}
          onClick={() => setShowEqModal(true)}
          aria-label="Equalizer and Sound Studio"
        >
          <Sliders className="size-4" />
        </button>
      </Tip>
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
        className={cn(iconBtn, "size-8", liked && "text-brand hover:text-brand-strong", className)}
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
          "inline-flex items-center justify-center rounded-full bg-white text-black shadow-md transition-transform outline-none hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand active:scale-95 disabled:pointer-events-none disabled:opacity-40",
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

function MobilePlayerModal({
  open,
  onClose,
  hasTrack,
}: {
  open: boolean;
  onClose: () => void;
  hasTrack: boolean;
}) {
  const track = usePlayer(selectCurrentTrack);
  const hydrated = useHydrated();
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const panel = usePlayer((s) => s.panel);
  const setPanel = usePlayer((s) => s.setPanel);
  const next = usePlayer((s) => s.next);
  const previous = usePlayer((s) => s.previous);
  const seekBy = usePlayer((s) => s.seekBy);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);

  const shuffleOn = hydrated && shuffle;
  const repeatMode = hydrated ? repeat : "off";
  const RepeatIcon = repeatMode === "one" ? Repeat1 : Repeat;
  const repeatLabel = repeatMode === "off" ? "Enable repeat" : repeatMode === "all" ? "Repeat one" : "Disable repeat";
  const active = "text-brand hover:text-brand-strong";
  const dot = (
    <span aria-hidden="true" className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand" />
  );

  if (!open || !track) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-linear-to-b from-neutral-900 via-[#0a0c0e] to-black text-white p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:hidden overflow-y-auto animate-in slide-in-from-bottom duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2">
        <button
          type="button"
          onClick={onClose}
          aria-label="Collapse player"
          className="grid size-10 place-items-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-transform"
        >
          <ChevronDown className="size-6" />
        </button>
        <div className="text-center min-w-0 px-2">
          <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Now Playing</p>
          <p className="max-w-[200px] truncate text-xs font-semibold text-white/90">
            {track.album || track.title}
          </p>
        </div>
        <div className="size-10 flex items-center justify-center">
          <LikeButton />
        </div>
      </div>

      {/* Album Artwork */}
      <div className="my-auto flex flex-col items-center justify-center py-4">
        <div className="relative aspect-square w-full max-w-[290px] overflow-hidden rounded-2xl shadow-2xl shadow-black ring-1 ring-white/15">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={track.artworkLarge || track.artwork}
            alt={`${track.title} artwork`}
            className="size-full object-cover"
          />
        </div>
      </div>

      {/* Track Info */}
      <div className="mt-3 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-bold text-white sm:text-2xl" title={track.title}>
            {track.title}
          </h2>
          <Link
            href={`/artist/${track.artist.id}`}
            onClick={onClose}
            className="mt-0.5 block truncate text-sm text-zinc-400 hover:text-white hover:underline"
          >
            {track.artist.name}
          </Link>
        </div>
      </div>

      {/* Seekbar */}
      <div className="mt-4">
        <SeekBar disabled={!hasTrack} />
      </div>

      {/* Controls */}
      <div className="mt-2 flex items-center justify-between px-1">
        <button
          type="button"
          className={cn("relative grid size-10 place-items-center text-zinc-400 transition-colors hover:text-white", shuffleOn && active)}
          aria-label={shuffleOn ? "Disable shuffle" : "Enable shuffle"}
          onClick={toggleShuffle}
        >
          <Shuffle className="size-5" />
          {shuffleOn && dot}
        </button>

        <button
          type="button"
          className="grid size-11 place-items-center text-zinc-300 hover:text-white active:scale-90 transition-transform"
          aria-label="Previous track"
          onClick={previous}
        >
          <SkipBack className="size-6 fill-current" />
        </button>

        <button
          type="button"
          className="grid size-9 place-items-center text-zinc-400 hover:text-white active:scale-90 transition-transform"
          aria-label="Rewind 5s"
          onClick={() => seekBy(-5)}
        >
          <RotateCcw className="size-5" />
        </button>

        <PlayToggle size="lg" disabled={!hasTrack} />

        <button
          type="button"
          className="grid size-9 place-items-center text-zinc-400 hover:text-white active:scale-90 transition-transform"
          aria-label="Forward 5s"
          onClick={() => seekBy(5)}
        >
          <RotateCw className="size-5" />
        </button>

        <button
          type="button"
          className="grid size-11 place-items-center text-zinc-300 hover:text-white active:scale-90 transition-transform"
          aria-label="Next track"
          onClick={next}
        >
          <SkipForward className="size-6 fill-current" />
        </button>

        <button
          type="button"
          className={cn("relative grid size-10 place-items-center text-zinc-400 transition-colors hover:text-white", repeatMode !== "off" && active)}
          aria-label={repeatLabel}
          onClick={cycleRepeat}
        >
          <RepeatIcon className="size-5" />
          {repeatMode !== "off" && dot}
        </button>
      </div>

      {/* Bottom Bar: Lyrics & Queue & Volume */}
      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              setPanel(panel === "lyrics" ? "none" : "lyrics");
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              panel === "lyrics" ? "bg-brand text-brand-foreground" : "bg-white/10 text-white hover:bg-white/15",
            )}
          >
            <MicVocal className="size-4" />
            <span>Lyrics</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              setPanel(panel === "queue" ? "none" : "queue");
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              panel === "queue" ? "bg-brand text-brand-foreground" : "bg-white/10 text-white hover:bg-white/15",
            )}
          >
            <ListMusic className="size-4" />
            <span>Queue</span>
          </button>
        </div>

        <div className="scale-90 origin-right">
          <VolumeControl compact />
        </div>
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
  const seekBy = usePlayer((s) => s.seekBy);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);
  const setPanel = usePlayer((s) => s.setPanel);
  const progress = usePlayer((s) => (s.duration > 0 ? s.position / s.duration : 0));
  const [mobileOpen, setMobileOpen] = useState(false);

  const shuffleOn = hydrated && shuffle;
  const repeatMode = hydrated ? repeat : "off";
  const RepeatIcon = repeatMode === "one" ? Repeat1 : Repeat;
  const repeatLabel = repeatMode === "off" ? "Enable repeat" : repeatMode === "all" ? "Repeat one" : "Disable repeat";
  const active = "text-brand hover:text-brand-strong";
  const dot = (
    <span aria-hidden="true" className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand" />
  );

  return (
    <TooltipProvider delay={400}>
      <VolumeHud />
      <EqualizerModal />
      <MobilePlayerModal open={mobileOpen} onClose={() => setMobileOpen(false)} hasTrack={hasTrack} />
      <footer
        aria-label="Player"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0b0c0e]/95 text-white backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)]"
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
              className="h-full bg-linear-to-r from-brand to-brand-2 transition-[width] duration-300 ease-linear"
              style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
            />
          </div>
          <div className="flex h-16 items-center gap-2 px-3">
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2 text-left outline-none"
              onClick={() => hasTrack && setMobileOpen(true)}
              aria-label="Open full screen player"
            >
              <TrackInfo compact />
            </button>
            <LikeButton />
            <Tip label="Lyrics">
              <button
                type="button"
                className={cn(iconBtn, panel === "lyrics" && active)}
                aria-label="Lyrics"
                onClick={() => setPanel(panel === "lyrics" ? "none" : "lyrics")}
                disabled={!hasTrack}
              >
                <MicVocal className="size-[18px]" />
              </button>
            </Tip>
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
              <Tip label="Rewind 5s (← / J)">
                <button
                  type="button"
                  className={cn(iconBtn, "size-8 text-zinc-400 hover:text-white")}
                  aria-label="Rewind 5 seconds"
                  onClick={() => seekBy(-5)}
                  disabled={!hasTrack}
                >
                  <RotateCcw className="size-[15px]" />
                </button>
              </Tip>
              <PlayToggle disabled={!hasTrack} />
              <Tip label="Forward 5s (→ / L)">
                <button
                  type="button"
                  className={cn(iconBtn, "size-8 text-zinc-400 hover:text-white")}
                  aria-label="Forward 5 seconds"
                  onClick={() => seekBy(5)}
                  disabled={!hasTrack}
                >
                  <RotateCw className="size-[15px]" />
                </button>
              </Tip>
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
            <Tip label="Lyrics">
              <button
                type="button"
                className={cn(iconBtn, panel === "lyrics" && active)}
                aria-label="Lyrics"
                aria-pressed={panel === "lyrics"}
                onClick={() => setPanel(panel === "lyrics" ? "none" : "lyrics")}
                disabled={!hasTrack}
              >
                <MicVocal className="size-[18px]" />
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
