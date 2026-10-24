"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SearchX } from "lucide-react";
import { ArtistCard } from "@/components/media/ArtistCard";
import { Artwork } from "@/components/media/Artwork";
import { EmptyState, ErrorState } from "@/components/media/ErrorState";
import { ExpandableTrackList } from "@/components/media/ExpandableTrackList";
import { CardPlayButton, CollectionCard } from "@/components/media/MediaCard";
import { Shelf } from "@/components/media/Shelf";
import { RecentSearchesShelf } from "@/components/search/RecentSearchesShelf";
import { fetchArtist, fetchCollection, useSearch } from "@/lib/api";
import { formatCount } from "@/lib/format";
import type { SearchResults } from "@/lib/types";
import { selectCurrentTrack, usePlayer } from "@/stores/player";
import { useRecentSearches } from "@/stores/recent-searches";
import { BrowseGrid } from "./BrowseGrid";
import { SearchSkeleton } from "./SearchSkeleton";

export function SearchView() {
  const q = (useSearchParams().get("q") ?? "").trim();
  const { data, error, loading, retry } = useSearch(q);

  const addArtist = useRecentSearches((s) => s.addArtist);
  const addAlbum = useRecentSearches((s) => s.addAlbum);
  const addPlaylist = useRecentSearches((s) => s.addPlaylist);

  if (!q) {
    return (
      <div className="space-y-10 pb-10">
        <RecentSearchesShelf />
        <BrowseGrid />
      </div>
    );
  }
  if (loading) return <SearchSkeleton />;
  if (error) return <ErrorState title="Search failed" message="We couldn't reach the catalog. Try again in a moment." onRetry={retry} />;
  if (!data) return null;

  const empty = !data.tracks.length && !data.artists.length && !data.playlists.length;
  if (empty) {
    return (
      <EmptyState
        icon={SearchX}
        title={`No results found for “${q}”`}
        message="Check the spelling or try different keywords, an artist name, or a genre."
      >
        <Link
          href="/search"
          className="mt-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold outline-none hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring"
        >
          Browse all
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-10 pb-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-labelledby="top-result">
          <h2 id="top-result" className="mb-3 text-2xl font-bold tracking-tight">
            Top result
          </h2>
          <TopResult data={data} q={q} />
        </section>
        {data.tracks.length > 0 && (
          <section aria-labelledby="songs">
            <h2 id="songs" className="mb-3 text-2xl font-bold tracking-tight">
              Songs
            </h2>
            <ExpandableTrackList tracks={data.tracks} label={`Songs matching ${q}`} hideHeader isSearch />
          </section>
        )}
      </div>

      {data.artists.length > 0 && (
        <Shelf title="Artists">
          {data.artists.map((a) => (
            <ArtistCard
              key={a.id}
              artist={a}
              onClick={() => addArtist(a)}
            />
          ))}
        </Shelf>
      )}
      {data.playlists.length > 0 && (
        <Shelf title="Playlists">
          {data.playlists.map((c) => (
            <CollectionCard
              key={c.id}
              collection={c}
              onClick={() => (c.kind === "album" ? addAlbum(c) : addPlaylist(c))}
            />
          ))}
        </Shelf>
      )}
    </div>
  );
}

function TopResult({ data, q }: { data: SearchResults; q: string }) {
  const addArtist = useRecentSearches((s) => s.addArtist);
  const addTrack = useRecentSearches((s) => s.addTrack);
  const addAlbum = useRecentSearches((s) => s.addAlbum);
  const addPlaylist = useRecentSearches((s) => s.addPlaylist);

  const playQueue = usePlayer((s) => s.playQueue);
  const playTrackWithSmartQueue = usePlayer((s) => s.playTrackWithSmartQueue);
  const toggle = usePlayer((s) => s.toggle);
  const firstTrack = data.tracks[0];
  const isCurrent = usePlayer((s) => (firstTrack ? selectCurrentTrack(s)?.id === firstTrack.id : false));
  const isPlaying = usePlayer((s) => s.isPlaying);

  const needle = q.toLowerCase();
  const artist = data.artists.find((a) => a.name.toLowerCase().includes(needle)) ?? null;
  const kind = artist ? "artist" : firstTrack ? "track" : data.artists[0] ? "artist" : "playlist";
  const topArtist = artist ?? data.artists[0];
  const playlist = data.playlists[0];

  const shell =
    "group relative flex min-h-56 flex-col gap-5 rounded-xl bg-neutral-900 p-5 transition-colors hover:bg-neutral-800";
  const heading = "text-3xl font-bold tracking-tight";
  const link = `${heading} outline-none after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring`;
  const pill = "w-fit rounded-full bg-black/40 px-3 py-1 text-xs font-semibold";

  const openArtistPanel = usePlayer((s) => s.openArtistPanel);

  if (kind === "artist" && topArtist) {
    const recordArtist = () => addArtist(topArtist);

    return (
      <div className={shell}>
        <Artwork src={topArtist.image} round fallback="artist" className="size-24 shadow-xl shadow-black/50" />
        <div className="min-w-0 space-y-2">
          <Link href={`/artist/${topArtist.id}`} onClick={recordArtist} className={`block truncate ${link}`}>
            {topArtist.name}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className={pill}>Artist</span>
            <span className="text-sm text-muted-foreground">{formatCount(topArtist.followers)} followers</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                recordArtist();
                openArtistPanel({ id: topArtist.id, name: topArtist.name });
              }}
              className="relative z-20 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/20"
            >
              All songs in side panel
            </button>
          </div>
        </div>
        <CardPlayButton
          label={`Play top tracks by ${topArtist.name}`}
          onPlay={async () => {
            recordArtist();
            const detail = await fetchArtist(topArtist.id);
            if (detail.topTracks.length) playQueue(detail.topTracks, 0);
          }}
          className="right-5 bottom-5"
        />
      </div>
    );
  }

  if (kind === "track" && firstTrack) {
    const playing = isCurrent && isPlaying;
    const recordTrack = () => addTrack(firstTrack);

    return (
      <div className={shell} onClick={recordTrack}>
        <Artwork src={firstTrack.artwork} className="size-24 shadow-xl shadow-black/50" />
        <div className="min-w-0 space-y-2">
          <div className={`truncate ${heading}`}>
            {firstTrack.title}
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <span className={pill}>Song</span>
            <Link
              href={`/artist/${firstTrack.artist.id}`}
              onClick={(e) => {
                e.stopPropagation();
                addArtist(firstTrack.artist);
              }}
              className="relative z-20 truncate text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              {firstTrack.artist.name}
            </Link>
          </div>
        </div>
        <CardPlayButton
          label={`${playing ? "Pause" : "Play"} ${firstTrack.title}`}
          playing={playing}
          onPlay={() => {
            recordTrack();
            if (isCurrent) toggle();
            else playTrackWithSmartQueue(firstTrack);
          }}
          className="right-5 bottom-5"
        />
      </div>
    );
  }

  if (playlist) {
    const recordPlaylist = () =>
      playlist.kind === "album" ? addAlbum(playlist) : addPlaylist(playlist);

    return (
      <div className={shell}>
        <Artwork src={playlist.artwork} className="size-24 shadow-xl shadow-black/50" />
        <div className="min-w-0 space-y-2">
          <Link href={`/playlist/${playlist.id}`} onClick={recordPlaylist} className={`block truncate ${link}`}>
            {playlist.title}
          </Link>
          <div className="flex items-center gap-2">
            <span className={pill}>{playlist.kind === "album" ? "Album" : "Playlist"}</span>
            <span className="truncate text-sm text-muted-foreground">{playlist.owner.name}</span>
          </div>
        </div>
        <CardPlayButton
          label={`Play ${playlist.title}`}
          onPlay={async () => {
            recordPlaylist();
            const detail = await fetchCollection(playlist.id);
            if (detail.tracks.length) playQueue(detail.tracks, 0);
          }}
          className="right-5 bottom-5"
        />
      </div>
    );
  }
  return null;
}
