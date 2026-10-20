"use client";

import { ArtistCard } from "@/components/media/ArtistCard";
import { ErrorState } from "@/components/media/ErrorState";
import { CollectionCard, TrackCard } from "@/components/media/MediaCard";
import { QuickPick } from "@/components/media/QuickPick";
import { CardSkeleton, Shelf, ShelfSkeleton } from "@/components/media/Shelf";
import { Skeleton } from "@/components/ui/skeleton";
import { useHome } from "@/lib/api";
import { genreHref } from "@/lib/genres";
import { useHydrated } from "@/lib/use-hydrated";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still up?";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const { data, error, loading, retry } = useHome();
  const hydrated = useHydrated();

  return (
    <div className="space-y-10 pb-10">
      <h1 className="text-3xl font-bold tracking-tight">{hydrated ? greeting() : "Welcome back"}</h1>

      {loading && <HomeSkeleton />}
      {error && <ErrorState message="We couldn't load the catalog. Check your connection and try again." onRetry={retry} />}

      {data && (
        <>
          {data.trending.length > 0 && (
            <section aria-label="Quick picks">
              <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
                {data.trending.slice(0, 8).map((t) => (
                  <QuickPick key={t.id} track={t} context={data.trending} />
                ))}
              </div>
            </section>
          )}

          {data.trending.length > 0 && (
            <Shelf title="Trending tracks">
              {data.trending.map((t) => (
                <TrackCard key={t.id} track={t} context={data.trending} />
              ))}
            </Shelf>
          )}

          {data.playlists.length > 0 && (
            <Shelf title="Popular playlists">
              {data.playlists.map((c) => (
                <CollectionCard key={c.id} collection={c} />
              ))}
            </Shelf>
          )}

          {data.artists.length > 0 && (
            <Shelf title="Popular artists">
              {data.artists.map((a) => (
                <ArtistCard key={a.id} artist={a} />
              ))}
            </Shelf>
          )}

          {Object.entries(data.genres)
            .filter(([, tracks]) => tracks.length > 0)
            .map(([genre, tracks]) => (
              <Shelf key={genre} title={genre} href={genreHref(genre)}>
                {tracks.map((t) => (
                  <TrackCard key={t.id} track={t} context={tracks} />
                ))}
              </Shelf>
            ))}
        </>
      )}
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="Loading">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-14 rounded-md bg-neutral-800 sm:h-16" />
        ))}
      </div>
      <ShelfSkeleton />
      <ShelfSkeleton />
      <section>
        <Skeleton className="mb-2 h-7 w-48 bg-neutral-800" />
        <div className="flex gap-1 overflow-hidden">
          {Array.from({ length: 7 }, (_, i) => (
            <CardSkeleton key={i} round className="w-[148px] shrink-0 sm:w-[170px] lg:w-[184px]" />
          ))}
        </div>
      </section>
    </div>
  );
}
