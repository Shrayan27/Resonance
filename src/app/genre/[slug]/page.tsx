"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ErrorState } from "@/components/media/ErrorState";
import { GenreIcon, genreGradient } from "@/components/media/GenreIcon";
import { PlayButton } from "@/components/media/PlayButton";
import { TrackList, TrackListSkeleton } from "@/components/media/TrackList";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/api";
import { type GenreDef, genreBySlug } from "@/lib/genres";
import type { Track } from "@/lib/types";

const PAGE = 40;
const RANGES = [
  { id: "", label: "Trending now" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "allTime", label: "All time" },
] as const;

interface GenrePage {
  tracks: Track[];
}

export default function GenreRoute() {
  return (
    <Suspense fallback={<TrackListSkeleton />}>
      <GenreView />
    </Suspense>
  );
}

function GenreView() {
  const params = useParams<{ slug: string }>();
  const genre = genreBySlug(params?.slug ?? "");
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("");
  if (!genre) return <ErrorState title="Genre not found" message="That genre doesn't exist." />;
  return <GenreContent key={`${genre.slug}:${range}`} genre={genre} range={range} onRange={setRange} />;
}

function GenreContent({
  genre,
  range,
  onRange,
}: {
  genre: GenreDef;
  range: (typeof RANGES)[number]["id"];
  onRange: (r: (typeof RANGES)[number]["id"]) => void;
}) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(true);
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const nextOffset = useRef(0);
  const inflight = useRef(false);

  const fetchPage = useCallback(
    async (offset: number) => {
      const qs = new URLSearchParams({ offset: String(offset), limit: String(PAGE) });
      if (range) qs.set("time", range);
      return fetchJson<GenrePage>(`/api/catalog/genres/${genre.slug}?${qs}`);
    },
    [genre.slug, range],
  );

  const apply = useCallback((offset: number, page: GenrePage) => {
    setTracks((prev) => {
      const seen = new Set(prev.map((t) => t.id));
      return [...prev, ...page.tracks.filter((t) => !seen.has(t.id))];
    });
    nextOffset.current = offset + PAGE;
    setMore(page.tracks.length >= PAGE / 2);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchPage(0).then(
      (page) => {
        if (cancelled) return;
        apply(0, page);
        setLoading(false);
      },
      (e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Something went wrong");
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [fetchPage, apply, attempt]);

  const loadMore = async () => {
    if (inflight.current) return;
    inflight.current = true;
    setLoading(true);
    setError(undefined);
    try {
      apply(nextOffset.current, await fetchPage(nextOffset.current));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      inflight.current = false;
      setLoading(false);
    }
  };

  const retry = () => {
    setError(undefined);
    setLoading(true);
    setAttempt((n) => n + 1);
  };

  return (
    <div className="space-y-6 pb-10">
      <header
        className="relative isolate overflow-hidden rounded-xl px-5 pt-10 pb-6 sm:px-8 sm:pt-16"
        style={{ backgroundImage: genreGradient(genre.hue) }}
      >
        <GenreIcon
          icon={genre.icon}
          strokeWidth={1.1}
          className="pointer-events-none absolute -right-6 -bottom-10 -z-10 size-64 rotate-[18deg] text-white/20 sm:size-80"
        />
        <span className="text-xs font-semibold tracking-wider uppercase">Genre</span>
        <h1 className="mt-1 text-4xl font-black tracking-tight sm:text-7xl">{genre.name}</h1>
        <p className="mt-2 text-sm text-white/80">
          {tracks.length > 0 ? `${tracks.length}${more ? "+" : ""} tracks` : "Loading tracks"}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <PlayButton tracks={tracks} label={genre.name} />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Time range">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={range === r.id}
              onClick={() => onRange(r.id)}
              className={
                range === r.id
                  ? "rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-black"
                  : "rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && tracks.length === 0 ? (
        <ErrorState message={error} onRetry={retry} />
      ) : loading && tracks.length === 0 ? (
        <TrackListSkeleton />
      ) : tracks.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">No tracks found for this range yet.</p>
      ) : (
        <>
          <TrackList tracks={tracks} label={`${genre.name} tracks`} />
          {more && (
            <div className="flex justify-center pt-2">
              <Button variant="secondary" disabled={loading} onClick={loadMore} className="min-w-40 rounded-full">
                {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
                {loading ? "Loading" : "Load more"}
              </Button>
            </div>
          )}
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
        </>
      )}
    </div>
  );
}
