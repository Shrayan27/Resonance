import { ShelfSkeleton } from "@/components/media/Shelf";
import { TrackListSkeleton } from "@/components/media/TrackList";
import { Skeleton } from "@/components/ui/skeleton";

export function SearchSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading results">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Skeleton className="h-56 rounded-xl bg-neutral-800" />
        <TrackListSkeleton rows={5} hideHeader />
      </div>
      <ShelfSkeleton round count={6} />
    </div>
  );
}
