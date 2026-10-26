"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useParams } from "next/navigation";
import { Heart } from "lucide-react";
import { ErrorState } from "@/components/media/ErrorState";
import { PageHeader } from "@/components/media/PageHeader";
import { PlayButton } from "@/components/media/PlayButton";
import { ShareButton } from "@/components/media/ShareButton";
import { TrackList, TrackListSkeleton } from "@/components/media/TrackList";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection } from "@/lib/api";
import { formatDuration } from "@/lib/duration";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/stores/library";
import { useRecentSearches } from "@/stores/recent-searches";

export default function PlaylistPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PlaylistView />
    </Suspense>
  );
}

function PlaylistView() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data, error, loading, retry } = useCollection(id);
  const hydrated = useHydrated();
  const toggleSave = useLibrary((s) => s.toggleSaveCollection);
  const saved = useLibrary((s) => s.savedCollections.some((c) => c.id === id)) && hydrated;

  useEffect(() => {
    if (data?.collection) {
      if (data.collection.kind === "album") {
        useRecentSearches.getState().addAlbum(data.collection);
      } else {
        useRecentSearches.getState().addPlaylist(data.collection);
      }
    }
  }, [data?.collection]);

  if (loading) return <PageSkeleton />;
  if (error || !data) {
    return <ErrorState title="Couldn't load this playlist" message={error} onRetry={retry} />;
  }

  const { collection, tracks } = data;
  const total = tracks.reduce((sum, t) => sum + t.durationSec, 0);
  const type = collection.kind === "album" ? "Album" : "Playlist";

  const distinctArtworks =
    collection.kind === "playlist"
      ? Array.from(
          new Set(tracks.map((t) => t.artworkLarge || t.artwork).filter(Boolean)),
        ).slice(0, 4)
      : [];

  const mosaicCover =
    distinctArtworks.length >= 4 ? (
      <div className="grid grid-cols-2 grid-rows-2 size-40 sm:size-52 shrink-0 overflow-hidden rounded-md shadow-2xl shadow-black/60 bg-neutral-800">
        {distinctArtworks.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={src} alt="" className="size-full object-cover" />
        ))}
      </div>
    ) : undefined;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        type={type}
        title={collection.title}
        seed={collection.id}
        image={collection.artworkLarge || collection.artwork}
        cover={mosaicCover}
        description={collection.description}
        meta={
          <>
            {collection.id.startsWith("user:") && collection.owner.id && collection.owner.id !== "guest" ? (
              <Link
                href={`/user/${collection.owner.id}`}
                className="font-semibold text-white hover:underline focus-visible:underline"
              >
                {collection.owner.name}
              </Link>
            ) : collection.id.startsWith("user:") ? (
              <span className="font-semibold text-white">
                {collection.owner.name}
              </span>
            ) : (
              <Link
                href={`/artist/${collection.owner.id}`}
                className="font-semibold text-white hover:underline focus-visible:underline"
              >
                {collection.owner.name}
              </Link>
            )}
            <span aria-hidden>·</span>
            <span>
              {tracks.length} {tracks.length === 1 ? "song" : "songs"}
            </span>
            {total > 0 && (
              <>
                <span aria-hidden>·</span>
                <span>{formatDuration(total)}</span>
              </>
            )}
          </>
        }
      >
        <PlayButton tracks={tracks} label={collection.title} />
        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? `Remove ${collection.title} from your library` : `Save ${collection.title} to your library`}
          onClick={() => toggleSave(collection)}
          className={cn(
            "grid size-10 place-items-center rounded-full outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring",
            saved ? "text-brand" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Heart className="size-7" fill={saved ? "currentColor" : "none"} aria-hidden />
        </button>
        <ShareButton title={collection.title} />
      </PageHeader>

      {tracks.length > 0 ? (
        <TrackList tracks={tracks} label={collection.title} />
      ) : (
        <p className="px-2 py-10 text-center text-sm text-muted-foreground">This {type.toLowerCase()} has no playable tracks yet.</p>
      )}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading playlist">
      <Skeleton className="h-[330px] rounded-xl bg-neutral-800 sm:h-[330px]" />
      <TrackListSkeleton />
    </div>
  );
}
