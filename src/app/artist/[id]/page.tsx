"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { ErrorState } from "@/components/media/ErrorState";
import { ExpandableTrackList } from "@/components/media/ExpandableTrackList";
import { CollectionCard } from "@/components/media/MediaCard";
import { PageHeader } from "@/components/media/PageHeader";
import { PlayButton } from "@/components/media/PlayButton";
import { Shelf } from "@/components/media/Shelf";
import { TrackListSkeleton } from "@/components/media/TrackList";
import { Skeleton } from "@/components/ui/skeleton";
import { useArtist } from "@/lib/api";
import { formatCount } from "@/lib/format";

export default function ArtistPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ArtistView />
    </Suspense>
  );
}

function ArtistView() {
  const params = useParams<{ id: string }>();
  const { data, error, loading, retry } = useArtist(params?.id);

  if (loading) return <PageSkeleton />;
  if (error || !data) return <ErrorState title="Couldn't load this artist" message={error} onRetry={retry} />;

  const { artist, topTracks, playlists } = data;

  return (
    <div className="space-y-10 pb-10">
      <PageHeader
        type="Artist"
        title={artist.name}
        seed={artist.id}
        image={artist.imageLarge || artist.image}
        round
        backdrop
        meta={<span>{formatCount(artist.followers)} followers</span>}
      >
        <PlayButton tracks={topTracks} label={`top tracks by ${artist.name}`} />
      </PageHeader>

      {topTracks.length > 0 ? (
        <section aria-labelledby="popular">
          <h2 id="popular" className="mb-3 px-1 text-2xl font-bold tracking-tight">
            Popular
          </h2>
          <ExpandableTrackList tracks={topTracks} label={`Popular tracks by ${artist.name}`} hideHeader showPlays />
        </section>
      ) : (
        <p className="px-2 py-6 text-center text-sm text-muted-foreground">{artist.name} hasn&apos;t shared any tracks yet.</p>
      )}

      {playlists.length > 0 && (
        <Shelf title="Playlists">
          {playlists.map((c) => (
            <CollectionCard key={c.id} collection={c} />
          ))}
        </Shelf>
      )}

      {artist.bio && (
        <section aria-labelledby="about" className="max-w-3xl">
          <h2 id="about" className="mb-3 px-1 text-2xl font-bold tracking-tight">
            About
          </h2>
          <p className="rounded-xl bg-card/60 p-5 text-sm leading-6 whitespace-pre-line text-muted-foreground">{artist.bio}</p>
        </section>
      )}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading artist">
      <Skeleton className="h-[330px] rounded-xl bg-neutral-800" />
      <TrackListSkeleton hideHeader rows={5} />
    </div>
  );
}
