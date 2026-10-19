"use client";

import { MediaCard } from "./MediaCard";
import { fetchArtist } from "@/lib/api";
import type { Artist } from "@/lib/types";
import { usePlayer } from "@/stores/player";

export function ArtistCard({ artist, className }: { artist: Artist; className?: string }) {
  const playQueue = usePlayer((s) => s.playQueue);
  return (
    <MediaCard
      round
      className={className}
      title={artist.name}
      subtitle="Artist"
      href={`/artist/${artist.id}`}
      image={artist.image}
      playLabel={`top tracks by ${artist.name}`}
      onPlay={async () => {
        const detail = await fetchArtist(artist.id);
        if (detail.topTracks.length) playQueue(detail.topTracks, 0);
      }}
    />
  );
}
