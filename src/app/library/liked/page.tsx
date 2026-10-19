"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { EmptyState } from "@/components/media/ErrorState";
import { PageHeader } from "@/components/media/PageHeader";
import { PlayButton } from "@/components/media/PlayButton";
import { TrackList, TrackListSkeleton } from "@/components/media/TrackList";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration } from "@/lib/duration";
import { useHydrated } from "@/lib/use-hydrated";
import { useLibrary } from "@/stores/library";

export default function LikedSongsPage() {
  const hydrated = useHydrated();
  const liked = useLibrary((s) => s.liked);
  const toggleLike = useLibrary((s) => s.toggleLike);

  if (!hydrated) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading liked songs">
        <Skeleton className="h-[330px] rounded-xl bg-neutral-800" />
        <TrackListSkeleton rows={5} />
      </div>
    );
  }

  const total = liked.reduce((sum, t) => sum + t.durationSec, 0);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        type="Playlist"
        title="Liked Songs"
        seed="liked-songs"
        cover={
          <div className="grid aspect-square w-40 shrink-0 place-items-center rounded-lg bg-linear-to-br from-emerald-400 via-teal-500 to-indigo-600 shadow-2xl shadow-black/60 sm:w-48 lg:w-56">
            <Heart className="size-1/2 text-white" fill="currentColor" aria-hidden />
          </div>
        }
        meta={
          <span>
            {liked.length} {liked.length === 1 ? "song" : "songs"}
            {total > 0 && ` · ${formatDuration(total)}`}
          </span>
        }
      >
        <PlayButton tracks={liked} label="Liked Songs" />
      </PageHeader>

      {liked.length > 0 ? (
        <TrackList
          tracks={liked}
          label="Liked Songs"
          onRemove={(t) => toggleLike(t)}
          removeLabel="Remove from Liked Songs"
        />
      ) : (
        <EmptyState
          icon={Heart}
          title="Songs you like will appear here"
          message="Tap the heart on any track to save it to your Liked Songs."
        >
          <Link
            href="/search"
            className="mt-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-bold text-background outline-none hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring"
          >
            Find something to play
          </Link>
        </EmptyState>
      )}
    </div>
  );
}
