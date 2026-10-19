"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { ListMusic, Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/media/ErrorState";
import { PageHeader } from "@/components/media/PageHeader";
import { PlayButton } from "@/components/media/PlayButton";
import { TrackList, TrackListSkeleton } from "@/components/media/TrackList";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration } from "@/lib/duration";
import { useHydrated } from "@/lib/use-hydrated";
import { useLibrary } from "@/stores/library";

function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading playlist">
      <Skeleton className="h-[330px] rounded-xl bg-neutral-800" />
      <TrackListSkeleton rows={4} />
    </div>
  );
}

export default function UserPlaylistPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <UserPlaylistView />
    </Suspense>
  );
}

function UserPlaylistView() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const hydrated = useHydrated();
  const playlist = useLibrary((s) => s.playlists.find((p) => p.id === id));
  const rename = useLibrary((s) => s.renamePlaylist);
  const remove = useLibrary((s) => s.deletePlaylist);
  const removeTrack = useLibrary((s) => s.removeFromPlaylist);
  const [draft, setDraft] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cancelled = useRef(false);

  if (!hydrated) return <PageSkeleton />;

  if (!playlist) {
    return (
      <EmptyState
        icon={ListMusic}
        title="Playlist not found"
        message="It may have been deleted, or it was created on another device."
      >
        <Link
          href="/library"
          className="mt-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-bold text-background outline-none hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring"
        >
          Go to your library
        </Link>
      </EmptyState>
    );
  }

  const commit = () => {
    if (cancelled.current) {
      cancelled.current = false;
      setDraft(null);
      return;
    }
    const name = draft?.trim();
    if (name && name !== playlist.name) rename(playlist.id, name);
    setDraft(null);
  };

  const total = playlist.tracks.reduce((sum, t) => sum + t.durationSec, 0);
  const cover = playlist.tracks[0]?.artworkLarge || playlist.tracks[0]?.artwork;

  const title =
    draft === null ? (
      <button
        type="button"
        onClick={() => setDraft(playlist.name)}
        aria-label={`Rename playlist ${playlist.name}`}
        className="group/title inline-flex max-w-full items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="min-w-0 break-words">{playlist.name}</span>
        <Pencil className="size-5 shrink-0 opacity-0 transition-opacity group-hover/title:opacity-70 group-focus-visible/title:opacity-70 sm:size-7" aria-hidden />
      </button>
    ) : (
      <Input
        autoFocus
        value={draft}
        maxLength={80}
        aria-label="Playlist name"
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            cancelled.current = true;
            e.currentTarget.blur();
          }
        }}
        className="h-auto border-white/30 bg-black/30 px-3 py-1 text-3xl font-black tracking-tight sm:text-5xl md:text-5xl lg:text-5xl"
      />
    );

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        type="Playlist"
        title={title}
        seed={playlist.id}
        image={cover}
        description={playlist.description}
        meta={
          <>
            <span className="font-semibold text-white">You</span>
            <span aria-hidden>·</span>
            <span>
              {playlist.tracks.length} {playlist.tracks.length === 1 ? "song" : "songs"}
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
        <PlayButton tracks={playlist.tracks} label={playlist.name} />
        <Button
          variant="ghost"
          onClick={() => setConfirmDelete(true)}
          aria-label={`Delete playlist ${playlist.name}`}
          className="h-10 gap-2 rounded-full px-4 text-muted-foreground hover:text-foreground"
        >
          <Trash2 aria-hidden /> Delete
        </Button>
      </PageHeader>

      {playlist.tracks.length > 0 ? (
        <TrackList
          tracks={playlist.tracks}
          label={playlist.name}
          onRemove={(t) => removeTrack(playlist.id, t.id)}
          removeLabel="Remove from this playlist"
        />
      ) : (
        <EmptyState
          icon={ListMusic}
          title="This playlist is empty"
          message="Use the “…” menu on any song and choose Add to playlist to fill it up."
        >
          <Link
            href="/search"
            className="mt-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-bold text-background outline-none hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring"
          >
            Find something to add
          </Link>
        </EmptyState>
      )}

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{playlist.name}”?</DialogTitle>
            <DialogDescription>
              This removes the playlist from your library. The songs themselves aren&apos;t affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmDelete(false);
                remove(playlist.id);
                router.push("/library");
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
