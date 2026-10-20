import type {
  Artist,
  ArtistDetail,
  Collection,
  CollectionDetail,
  HomeFeed,
  SearchResults,
  Track,
} from "./types";

const API = "https://api.audius.co/v1";
const APP_NAME = "resonance-player";

/* eslint-disable @typescript-eslint/no-explicit-any */

async function call<T = any>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`${API}${path}`);
  url.searchParams.set("app_name", APP_NAME);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Catalog request failed (${res.status}) for ${path}`);
  const json = await res.json();
  return json.data as T;
}

export function mapTrack(t: any): Track {
  return {
    id: t.id,
    title: t.title,
    artist: { id: t.user?.id ?? "", name: t.user?.name ?? "Unknown artist" },
    artwork: t.artwork?.["150x150"] ?? t.artwork?.["480x480"] ?? "",
    artworkLarge: t.artwork?.["1000x1000"] ?? t.artwork?.["480x480"] ?? "",
    durationSec: t.duration ?? 0,
    streamUrl: `/api/stream/${t.id}`,
    playCount: t.play_count,
    genre: t.genre,
  };
}

export function mapCollection(p: any): Collection {
  return {
    id: p.id,
    kind: p.is_album ? "album" : "playlist",
    title: p.playlist_name,
    description: p.description ?? undefined,
    owner: { id: p.user?.id ?? "", name: p.user?.name ?? "Unknown" },
    artwork: p.artwork?.["480x480"] ?? p.artwork?.["150x150"] ?? "",
    artworkLarge: p.artwork?.["1000x1000"] ?? p.artwork?.["480x480"] ?? "",
    trackCount: p.track_count ?? 0,
  };
}

export function mapArtist(u: any): Artist {
  return {
    id: u.id,
    name: u.name,
    image: u.profile_picture?.["480x480"] ?? u.profile_picture?.["150x150"] ?? "",
    imageLarge: u.profile_picture?.["1000x1000"] ?? u.profile_picture?.["480x480"] ?? "",
    followers: u.follower_count ?? 0,
    bio: u.bio ?? undefined,
  };
}

const playable = (t: any) => t.is_streamable !== false && !t.is_delete && !t.is_unlisted;

import { HOME_GENRES } from "./genres";

const GENRE_NAMES = HOME_GENRES.map((g) => g.name);

export async function getGenreTracks(genre: string, offset = 0, limit = 40, time?: string): Promise<Track[]> {
  const params: Record<string, string | number> = { genre, limit, offset };
  if (time) params.time = time;
  const tracks = await call<any[]>("/tracks/trending", params);
  return tracks.filter(playable).map(mapTrack);
}

export async function getHome(): Promise<HomeFeed> {
  const [trending, playlists, artists, ...genreTracks] = await Promise.all([
    call<any[]>("/tracks/trending", { limit: 40 }),
    call<any[]>("/playlists/trending", { limit: 24 }),
    Promise.resolve([] as any[]),
    ...GENRE_NAMES.map((g) =>
      call<any[]>("/tracks/trending", { limit: 20, genre: g }).catch(() => [] as any[]),
    ),
  ]);
  const genres: Record<string, Track[]> = {};
  GENRE_NAMES.forEach((g, i) => {
    const list = genreTracks[i].filter(playable).map(mapTrack);
    if (list.length) genres[g] = list;
  });
  const seen = new Set<string>();
  const derivedArtists = [...trending, ...genreTracks.flat()]
    .map((t) => t.user)
    .filter((u) => u && !seen.has(u.id) && seen.add(u.id))
    .slice(0, 24);
  return {
    trending: trending.filter(playable).map(mapTrack),
    playlists: playlists.filter((p) => !p.is_delete && !p.is_private).map(mapCollection),
    artists: (artists.length ? artists : derivedArtists).map(mapArtist),
    genres,
  };
}

export async function search(query: string): Promise<SearchResults> {
  const [tracks, playlists, artists] = await Promise.all([
    call<any[]>("/tracks/search", { query, limit: 50 }),
    call<any[]>("/playlists/search", { query, limit: 20 }),
    call<any[]>("/users/search", { query, limit: 20 }),
  ]);
  return {
    query,
    tracks: tracks.filter(playable).map(mapTrack),
    playlists: playlists.filter((p) => !p.is_delete && !p.is_private).map(mapCollection),
    artists: artists.map(mapArtist),
  };
}

export async function getPlaylist(id: string): Promise<CollectionDetail> {
  const [list, tracks] = await Promise.all([
    call<any[]>(`/playlists/${id}`),
    call<any[]>(`/playlists/${id}/tracks`),
  ]);
  return { collection: mapCollection(list[0]), tracks: tracks.filter(playable).map(mapTrack) };
}

export async function getArtist(id: string): Promise<ArtistDetail> {
  const [user, tracks, playlists] = await Promise.all([
    call<any>(`/users/${id}`),
    call<any[]>(`/users/${id}/tracks`, { sort: "plays", limit: 20 }),
    call<any[]>(`/users/${id}/playlists`, { limit: 12 }).catch(() => [] as any[]),
  ]);
  return {
    artist: mapArtist(user),
    topTracks: tracks.filter(playable).map(mapTrack),
    playlists: playlists.filter((p) => !p.is_private).map(mapCollection),
  };
}

export async function resolveStreamUrl(id: string): Promise<string> {
  const url = new URL(`${API}/tracks/${encodeURIComponent(id)}/stream`);
  url.searchParams.set("app_name", APP_NAME);
  url.searchParams.set("no_redirect", "true");
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Stream lookup failed (${res.status})`);
  const json = await res.json();
  return json.data as string;
}
