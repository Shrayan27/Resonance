"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PanelRight, Search } from "lucide-react";
import { ErrorState } from "@/components/media/ErrorState";
import { ExpandableTrackList } from "@/components/media/ExpandableTrackList";
import { CollectionCard } from "@/components/media/MediaCard";
import { PageHeader } from "@/components/media/PageHeader";
import { PlayButton } from "@/components/media/PlayButton";
import { Shelf } from "@/components/media/Shelf";
import { TrackList, TrackListSkeleton } from "@/components/media/TrackList";
import { Skeleton } from "@/components/ui/skeleton";
import { useArtist } from "@/lib/api";
import { formatCount } from "@/lib/format";
import { usePlayer } from "@/stores/player";
import { useRecentSearches } from "@/stores/recent-searches";
import { cn } from "@/lib/utils";

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
  const openArtistPanel = usePlayer((s) => s.openArtistPanel);

  useEffect(() => {
    if (data?.artist) {
      useRecentSearches.getState().addArtist(data.artist);
    }
  }, [data?.artist]);

  const [activeTab, setActiveTab] = useState<"popular" | "all">("popular");
  const [songQuery, setSongQuery] = useState("");

  const topTracks = useMemo(() => data?.topTracks || [], [data?.topTracks]);
  const filteredAllTracks = useMemo(() => {
    if (!topTracks) return [];
    if (!songQuery.trim()) return topTracks;
    const q = songQuery.toLowerCase();
    return topTracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.album && t.album.toLowerCase().includes(q)),
    );
  }, [topTracks, songQuery]);

  if (loading) return <PageSkeleton />;
  if (error || !data) return <ErrorState title="Couldn't load this artist" message={error} onRetry={retry} />;

  const { artist, playlists } = data;

  return (
    <div className="space-y-10 pb-10">
      <PageHeader
        type="Artist"
        title={artist.name}
        seed={artist.id}
        image={artist.imageLarge || artist.image}
        round
        backdrop
        meta={
          <span>
            {formatCount(artist.followers)} followers · {topTracks.length} songs available
          </span>
        }
      >
        <PlayButton tracks={topTracks} label={`top tracks by ${artist.name}`} />
        <button
          type="button"
          onClick={() => openArtistPanel({ id: artist.id, name: artist.name })}
          className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          <PanelRight className="size-4 text-brand" />
          <span>Open in side panel</span>
        </button>
      </PageHeader>

      {/* Tabs: Popular vs All Songs */}
      {topTracks.length > 0 ? (
        <section aria-labelledby="artist-tracks">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("popular")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors outline-none",
                  activeTab === "popular"
                    ? "bg-white text-black"
                    : "text-zinc-400 hover:text-white hover:bg-white/10",
                )}
              >
                Popular
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors outline-none",
                  activeTab === "all"
                    ? "bg-white text-black"
                    : "text-zinc-400 hover:text-white hover:bg-white/10",
                )}
              >
                All Songs ({topTracks.length})
              </button>
            </div>

            {/* Quick in-page track search */}
            {activeTab === "all" && (
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={songQuery}
                  onChange={(e) => setSongQuery(e.target.value)}
                  placeholder={`Search ${artist.name}'s songs...`}
                  className="h-8 w-full rounded-md border border-white/10 bg-white/5 pr-3 pl-8 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-brand/60 focus:bg-white/10"
                />
              </div>
            )}
          </div>

          {activeTab === "popular" ? (
            <ExpandableTrackList
              tracks={topTracks}
              initial={10}
              label={`Popular tracks by ${artist.name}`}
              hideHeader
              showPlays
            />
          ) : (
            <TrackList
              tracks={filteredAllTracks}
              label={`All songs by ${artist.name}`}
              showPlays
            />
          )}
        </section>
      ) : (
        <p className="px-2 py-6 text-center text-sm text-muted-foreground">
          {artist.name} hasn&apos;t shared any tracks yet.
        </p>
      )}

      {playlists.length > 0 && (
        <Shelf title="Albums & Discography">
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
          <p className="rounded-xl bg-card/60 p-5 text-sm leading-6 whitespace-pre-line text-muted-foreground">
            {artist.bio}
          </p>
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
