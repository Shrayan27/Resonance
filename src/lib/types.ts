export interface ArtistRef {
  id: string;
  name: string;
}

export interface Track {
  id: string;
  title: string;
  artist: ArtistRef;
  album?: string;
  artwork: string;
  artworkLarge: string;
  durationSec: number;
  streamUrl: string;
  playCount?: number;
  genre?: string;
}

export type CollectionKind = "playlist" | "album";

export interface Collection {
  id: string;
  kind: CollectionKind;
  title: string;
  description?: string;
  owner: ArtistRef;
  artwork: string;
  artworkLarge: string;
  trackCount: number;
}

export interface Artist {
  id: string;
  name: string;
  image: string;
  imageLarge: string;
  followers: number;
  bio?: string;
}

export interface HomeFeed {
  trending: Track[];
  playlists: Collection[];
  artists: Artist[];
  genres: Record<string, Track[]>;
}

export interface SearchResults {
  query: string;
  tracks: Track[];
  playlists: Collection[];
  artists: Artist[];
}

export interface CollectionDetail {
  collection: Collection;
  tracks: Track[];
}

export interface ArtistDetail {
  artist: Artist;
  topTracks: Track[];
  playlists: Collection[];
}

export interface UserPlaylist {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  tracks: Track[];
  createdAt: number;
}
