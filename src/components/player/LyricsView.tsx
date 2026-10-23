"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MicOff, Music, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LyricsResult, Track } from "@/lib/types";
import { selectCurrentTrack, usePlayer } from "@/stores/player";

const lyricsCache = new Map<string, LyricsResult>();

function TrackLyrics({ track }: { track: Track }) {
  const position = usePlayer((s) => s.position);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const seek = usePlayer((s) => s.seek);

  const cacheKey = `${track.title}__${track.artist.name}`;
  const initialData = lyricsCache.get(cacheKey) ?? null;

  const [loading, setLoading] = useState<boolean>(() => !initialData);
  const [data, setData] = useState<LyricsResult | null>(initialData);
  const [userScrolled, setUserScrolled] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLButtonElement | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (lyricsCache.has(cacheKey)) {
      return;
    }

    let cancelled = false;

    const params = new URLSearchParams({
      title: track.title,
      artist: track.artist.name,
    });
    if (track.durationSec) {
      params.set("duration", String(track.durationSec));
    }

    fetch(`/api/lyrics?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((result: LyricsResult | null) => {
        if (cancelled) return;
        const res = result ?? { synced: false, lines: [], plain: "" };
        lyricsCache.set(cacheKey, res);
        setData(res);
      })
      .catch(() => {
        if (!cancelled) {
          const res = { synced: false, lines: [], plain: "" };
          lyricsCache.set(cacheKey, res);
          setData(res);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [track, cacheKey]);

  // Determine active lyric line index based on current playback position
  const lines = data?.lines ?? [];
  let activeIndex = -1;
  if (data?.synced && lines.length > 0) {
    for (let i = lines.length - 1; i >= 0; i--) {
      // 0.2s lead-in offset for natural human speech perception
      if (position >= lines[i].time - 0.2) {
        activeIndex = i;
        break;
      }
    }
  }

  // Smooth auto-scroll to active line
  const scrollToActive = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (!activeLineRef.current || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const activeEl = activeLineRef.current;

    const containerHeight = container.clientHeight;
    const elTop = activeEl.offsetTop;
    const elHeight = activeEl.clientHeight;

    const targetScrollTop = elTop - containerHeight / 2 + elHeight / 2;
    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior,
    });
  }, []);

  // Track user manual scrolling to temporarily pause auto-scroll
  const handleScroll = () => {
    setUserScrolled(true);
    clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setUserScrolled(false);
    }, 4500);
  };

  const handleResumeSync = () => {
    clearTimeout(scrollTimeoutRef.current);
    setUserScrolled(false);
    scrollToActive("smooth");
  };

  useEffect(() => {
    if (!userScrolled && activeIndex >= 0) {
      scrollToActive("smooth");
    }
  }, [activeIndex, userScrolled, scrollToActive]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 overflow-hidden px-6 pt-6 pb-12 animate-pulse">
        <div className="flex items-center gap-2 text-xs font-medium text-brand">
          <Sparkles className="size-3.5 animate-spin" />
          <span>Searching lyrics...</span>
        </div>
        <div className="h-6 w-3/4 rounded-md bg-white/10" />
        <div className="h-6 w-1/2 rounded-md bg-white/10" />
        <div className="h-7 w-5/6 rounded-md bg-white/15" />
        <div className="h-6 w-2/3 rounded-md bg-white/10" />
        <div className="h-6 w-4/5 rounded-md bg-white/10" />
        <div className="h-6 w-3/5 rounded-md bg-white/10" />
        <div className="h-6 w-1/2 rounded-md bg-white/10" />
      </div>
    );
  }

  if (data?.instrumental) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-12 text-center">
        <div className="relative flex size-16 items-center justify-center rounded-full bg-brand/10 text-brand ring-1 ring-brand/30">
          <Music className={cn("size-7", isPlaying && "animate-bounce")} />
        </div>
        <p className="text-base font-semibold text-white">Instrumental Track</p>
        <p className="max-w-[220px] text-xs text-zinc-400">This song contains no vocal lyrics.</p>
      </div>
    );
  }

  const hasSynced = data?.synced && lines.length > 0;
  const hasPlain = !!data?.plain?.trim();

  if (!hasSynced && !hasPlain) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-white/5 text-zinc-400">
          <MicOff className="size-6" />
        </div>
        <p className="text-sm font-medium text-white">Couldn&apos;t find lyrics</p>
        <p className="max-w-[220px] text-xs text-zinc-400">
          We couldn&apos;t find lyrics for &ldquo;{track.title}&rdquo;.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Floating Re-sync badge if user scrolled away */}
      {userScrolled && hasSynced && activeIndex >= 0 && (
        <button
          type="button"
          onClick={handleResumeSync}
          className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-black shadow-lg shadow-black/60 transition-transform hover:scale-105 active:scale-95"
        >
          <RotateCcw className="size-3.5" />
          <span>Sync lyrics</span>
        </button>
      )}

      {/* Lyrics container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-24 scroll-smooth"
      >
        {hasSynced ? (
          <div className="space-y-4">
            {lines.map((line, idx) => {
              const isCurrent = idx === activeIndex;
              const isPast = activeIndex !== -1 && idx < activeIndex;

              if (!line.text) {
                return <div key={`${line.time}-${idx}`} className="h-4" aria-hidden="true" />;
              }

              return (
                <button
                  key={`${line.time}-${idx}`}
                  ref={isCurrent ? (el) => { activeLineRef.current = el; } : undefined}
                  type="button"
                  onClick={() => {
                    seek(line.time);
                    setUserScrolled(false);
                  }}
                  className={cn(
                    "block w-full text-left font-sans text-lg font-bold leading-relaxed transition-all duration-300 outline-none select-none",
                    isCurrent
                      ? "scale-[1.03] origin-left text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.3)]"
                      : isPast
                        ? "text-white/60 hover:text-white"
                        : "text-white/25 hover:text-white/60",
                  )}
                >
                  {line.text}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="whitespace-pre-wrap font-sans text-base font-semibold leading-relaxed text-zinc-300">
            {data?.plain}
          </div>
        )}
      </div>
    </div>
  );
}

export function LyricsView() {
  const track = usePlayer(selectCurrentTrack);

  if (!track) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-white/5 text-zinc-400">
          <Music className="size-6" />
        </div>
        <p className="text-sm font-medium text-white">No song playing</p>
        <p className="text-xs text-zinc-400">Play a song to view synchronized lyrics.</p>
      </div>
    );
  }

  return <TrackLyrics key={track.id} track={track} />;
}
