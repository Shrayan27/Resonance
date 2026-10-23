import dns from "node:dns";
import CryptoJS from "crypto-js";
import type { Artist, ArtistDetail, Collection, CollectionDetail, SearchResults, Track } from "./types";

try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Ignore in environments where not supported
}

const SAAVN_API = "https://www.jiosaavn.com/api.php";
const DES_KEY = "38346591";

/* eslint-disable @typescript-eslint/no-explicit-any */

function decodeEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanImageUrl(url?: string): string {
  if (!url) return "";
  return url
    .replace("50x50.jpg", "500x500.jpg")
    .replace("150x150.jpg", "500x500.jpg")
    .replace("http://", "https://");
}

export function decryptMediaUrl(encryptedUrl: string): string {
  if (!encryptedUrl) return "";
  try {
    const key = CryptoJS.enc.Utf8.parse(DES_KEY);
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl),
    });
    const decrypted = CryptoJS.DES.decrypt(cipherParams, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    const rawUrl = decrypted.toString(CryptoJS.enc.Utf8);
    // Upgrade standard 96/160kbps to high quality 320kbps MP4 AAC
    return rawUrl.replace(/_(96|160)\.mp4$/, "_320.mp4");
  } catch {
    return "";
  }
}

const streamCache = new Map<string, string>();

async function callSaavn<T = any>(params: Record<string, string | number>): Promise<T | null> {
  const url = new URL(SAAVN_API);
  url.searchParams.set("_format", "json");
  url.searchParams.set("_marker", "0");
  url.searchParams.set("api_version", "4");
  url.searchParams.set("ctx", "web6dot0");

  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9,hi;q=0.8,ur;q=0.7",
        Cookie: "L=hindi%2Curdu%2Cpunjabi%2Cenglish; gdpr_acceptance=true; DL=english",
        Referer: "https://www.jiosaavn.com/",
      },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function mapSaavnTrack(song: any): Track {
  const info = song.more_info || {};
  const songId = String(song.id || "");

  // Pre-cache direct decrypted stream URL if available
  if (info.encrypted_media_url && songId) {
    if (!streamCache.has(songId)) {
      const decrypted = decryptMediaUrl(info.encrypted_media_url);
      if (decrypted) streamCache.set(songId, decrypted);
    }
  }

  const primaryArtist = info.artistMap?.primary_artists?.[0];
  const artistName = decodeEntities(
    primaryArtist?.name ||
    song.subtitle?.split("-")[0]?.trim() ||
    info.music ||
    "Unknown Artist"
  );
  const artistId = String(
    primaryArtist?.id ||
    info.music_id ||
    song.artistId ||
    "saavn-artist"
  );

  const duration = parseInt(info.duration, 10) || 0;
  const playCount = parseInt(song.play_count, 10) || undefined;
  const albumName = info.album ? decodeEntities(info.album) : undefined;

  return {
    id: `saavn:${songId}`,
    title: decodeEntities(song.title),
    artist: {
      id: `saavn:${artistId}`,
      name: artistName,
    },
    album: albumName,
    artwork: cleanImageUrl(song.image),
    artworkLarge: cleanImageUrl(song.image),
    durationSec: duration,
    streamUrl: `/api/stream/saavn:${songId}`,
    playCount,
    genre: song.language,
  };
}

export function mapSaavnArtist(artist: any): Artist {
  const name = decodeEntities(artist.name || artist.title);
  const followers = parseInt(artist.follower_count || artist.ctr || "0", 10) || 0;
  const img = cleanImageUrl(artist.image);

  return {
    id: `saavn:${artist.id || artist.artistId}`,
    name,
    image: img,
    imageLarge: img,
    followers,
    bio: artist.bio ? decodeEntities(artist.bio) : undefined,
  };
}

export function mapSaavnAlbum(album: any): Collection {
  const info = album.more_info || {};
  const title = decodeEntities(album.title || album.name);
  const ownerName = decodeEntities(info.music || album.music || info.artist || "Unknown");
  const ownerId = String(info.artistMap?.primary_artists?.[0]?.id || album.artistId || "saavn-artist");

  return {
    id: `saavn:album:${album.id || album.albumid}`,
    kind: "album",
    title,
    description: info.year ? `Released in ${info.year}` : undefined,
    owner: {
      id: `saavn:${ownerId}`,
      name: ownerName,
    },
    artwork: cleanImageUrl(album.image),
    artworkLarge: cleanImageUrl(album.image),
    trackCount: parseInt(info.song_count || album.list_count || "0", 10) || 0,
  };
}

export async function searchSaavn(query: string): Promise<SearchResults> {
  const [songRes, artistRes, albumRes] = await Promise.all([
    callSaavn<{ results?: any[] }>({ __call: "search.getResults", q: query, p: 1, n: 40 }),
    callSaavn<{ results?: any[] }>({ __call: "search.getArtistResults", q: query, p: 1, n: 10 }),
    callSaavn<{ results?: any[] }>({ __call: "search.getAlbumResults", q: query, p: 1, n: 10 }),
  ]);

  const tracks = (songRes?.results || []).map(mapSaavnTrack);
  const artists = (artistRes?.results || []).map(mapSaavnArtist);
  const playlists = (albumRes?.results || []).map(mapSaavnAlbum);

  return {
    query,
    tracks,
    artists,
    playlists,
  };
}

function normalizeArtistText(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isSongByArtist(song: any, artistName: string, artistId: string, dominantLanguage?: string): boolean {
  if (!song) return false;

  // Filter out songs from completely different languages if the artist has an established dominant language
  // e.g. Pakistani pop singer (dominant: "hindi" or "urdu") having erroneously merged Bangladeshi songs ("bengali")
  const songLang = String(song.language || "").toLowerCase().trim();
  const domLang = String(dominantLanguage || "").toLowerCase().trim();
  if ((domLang === "hindi" || domLang === "urdu") && songLang === "bengali") {
    return false;
  }

  const info = song.more_info || {};
  const artistMap = info.artistMap || {};
  const performers = [
    ...(artistMap.primary_artists || []),
    ...(artistMap.featured_artists || []),
  ];

  // 1. Direct Saavn artist ID match in primary or featured performers
  const cleanId = String(artistId || "").trim();
  if (cleanId && performers.some((a: any) => String(a.id || "").trim() === cleanId)) {
    return true;
  }

  // 2. Exact or word-bounded artist name match in performers
  const normTarget = normalizeArtistText(artistName);
  if (!normTarget) return false;

  const targetRegex = new RegExp(`(^|\\b)${escapeRegex(normTarget)}(\\b|$)`, "i");

  const hasPerformerMatch = performers.some((a: any) => {
    const normName = normalizeArtistText(a.name || "");
    return normName === normTarget || targetRegex.test(normName);
  });
  if (hasPerformerMatch) return true;

  // 3. Subtitle performers check (e.g., "Abdul Hannan, Samar Jafri - Khasara")
  const subtitleArtists = (song.subtitle || "").split("-")[0] || "";
  const normSubtitle = normalizeArtistText(subtitleArtists);
  if (normSubtitle && targetRegex.test(normSubtitle)) {
    return true;
  }

  // 4. Singers list check (if available in more_info)
  if (info.singers) {
    const normSingers = normalizeArtistText(info.singers);
    if (normSingers && targetRegex.test(normSingers)) {
      return true;
    }
  }

  // 5. Music composer check only if song has no competing foreign primary singers
  if (info.music) {
    const normMusic = normalizeArtistText(info.music);
    if (normMusic === normTarget && (!performers.length || performers.every((p: any) => normalizeArtistText(p.name || "") === normTarget))) {
      return true;
    }
  }

  return false;
}

function isAlbumByArtist(album: any, artistName: string, artistId: string): boolean {
  if (!album) return false;
  const cleanId = String(artistId || "").trim();
  const normTarget = normalizeArtistText(artistName);
  if (!normTarget) return false;

  const targetRegex = new RegExp(`(^|\\b)${escapeRegex(normTarget)}(\\b|$)`, "i");

  const info = album.more_info || {};
  const artistMap = info.artistMap || {};
  const performers = [
    ...(artistMap.primary_artists || []),
    ...(artistMap.featured_artists || []),
  ];

  if (cleanId && performers.some((a: any) => String(a.id || "").trim() === cleanId)) {
    return true;
  }

  if (performers.some((a: any) => targetRegex.test(normalizeArtistText(a.name || "")))) {
    return true;
  }

  const music = normalizeArtistText(info.music || album.music || "");
  const artist = normalizeArtistText(info.artist || album.artist || "");
  if (music && targetRegex.test(music)) return true;
  if (artist && targetRegex.test(artist)) return true;

  return false;
}

export async function getSaavnArtist(artistIdWithPrefix: string): Promise<ArtistDetail> {
  const rawId = artistIdWithPrefix.replace(/^saavn:/, "");

  // 1. Fetch artist details with up to 50 songs and 30 albums for primary profile
  const details = await callSaavn<any>({
    __call: "artist.getArtistPageDetails",
    artistId: rawId,
    n_song: 50,
    n_album: 30,
  });

  if (!details) {
    throw new Error(`Failed to load artist details for ${rawId}`);
  }

  const artist = mapSaavnArtist(details);
  const normTarget = normalizeArtistText(artist.name);

  // 2. Fetch top songs from primary artist page
  const primaryRaw: any[] = details.topSongs || [];

  // 3. Find related collaboration profiles on JioSaavn (e.g. "Abdul Hannan & Rovalio", "Rovalio & Abdul Hannan", "Abdul Hannan & BAIG")
  const relatedSongsRaw: any[] = [];
  try {
    const artistSearch = await callSaavn<{ results?: any[] }>({
      __call: "search.getArtistResults",
      q: artist.name,
      n: 8,
    });

    const targetRegex = new RegExp(`(^|\\b)${escapeRegex(normTarget)}(\\b|$)`, "i");

    const matchingProfiles = (artistSearch?.results || []).filter((a: any) => {
      const aId = String(a.id || "").trim();
      if (aId === rawId) return false;
      const aName = a.name || "";
      const isCollab = /[&,]|(\band\b)|(\bfeat\b)|(\bft\b)/i.test(aName);
      if (!isCollab) return false;
      return targetRegex.test(normalizeArtistText(aName));
    });

    if (matchingProfiles.length > 0) {
      const relatedDetails = await Promise.all(
        matchingProfiles.slice(0, 4).map((p: any) =>
          callSaavn<any>({
            __call: "artist.getArtistPageDetails",
            artistId: p.id,
            n_song: 30,
          })
        )
      );

      for (const rd of relatedDetails) {
        if (rd?.topSongs && Array.isArray(rd.topSongs)) {
          relatedSongsRaw.push(...rd.topSongs);
        }
      }
    }
  } catch {
    // Graceful fallback to primary tracks
  }

  const seen = new Set<string>();
  const allTracks: Track[] = [];
  const domLang = details.dominantLanguage || details.language;

  // Merge collaboration tracks first (Iraaday, Bikhra, etc.) then primary tracks
  for (const s of [...relatedSongsRaw, ...primaryRaw]) {
    if (s?.id && !seen.has(s.id)) {
      if (isSongByArtist(s, artist.name, rawId, domLang)) {
        seen.add(s.id);
        allTracks.push(mapSaavnTrack(s));
      }
    }
  }

  // Sort by playCount descending so biggest hits appear at the top
  allTracks.sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0));

  // If artist image is generic placeholder, use artwork from the artist's top hit
  if (!artist.image || artist.image.includes("share-image") || artist.image.includes("artist-default")) {
    if (allTracks[0]?.artworkLarge || allTracks[0]?.artwork) {
      artist.image = allTracks[0].artworkLarge || allTracks[0].artwork;
      artist.imageLarge = artist.image;
    }
  }

  const albums = (details.topAlbums || [])
    .filter((a: any) => isAlbumByArtist(a, artist.name, rawId))
    .map(mapSaavnAlbum);

  return {
    artist,
    topTracks: allTracks,
    playlists: albums,
  };
}

export async function getSaavnAlbum(albumIdWithPrefix: string): Promise<CollectionDetail> {
  const cleanId = decodeURIComponent(albumIdWithPrefix);
  const isPlaylist = cleanId.includes(":playlist:");
  const rawId = cleanId
    .replace(/^saavn:playlist:/, "")
    .replace(/^saavn:album:/, "")
    .replace(/^saavn:/, "");

  let data: any = null;

  if (isPlaylist) {
    data = await callSaavn<any>({
      __call: "playlist.getDetails",
      listid: rawId,
    });
  } else {
    data = await callSaavn<any>({
      __call: "content.getAlbumDetails",
      albumid: rawId,
    });
  }

  // Fallback: if not found as album, try as playlist, and vice-versa
  if (!data || (!data.list && !data.songs)) {
    const fallbackCall = isPlaylist ? "content.getAlbumDetails" : "playlist.getDetails";
    const fallbackParam = isPlaylist ? "albumid" : "listid";
    const fallbackData = await callSaavn<any>({
      __call: fallbackCall,
      [fallbackParam]: rawId,
    });
    if (fallbackData && (fallbackData.list || fallbackData.songs)) {
      data = fallbackData;
    }
  }

  if (!data) {
    throw new Error(`Failed to load album or playlist ${rawId}`);
  }

  const collection = mapSaavnAlbum(data);
  const rawList = Array.isArray(data.list)
    ? data.list
    : Array.isArray(data.songs)
      ? data.songs
      : [];
  const tracks = rawList.map(mapSaavnTrack);

  return {
    collection,
    tracks,
  };
}

export async function resolveSaavnStreamUrl(songIdWithPrefix: string): Promise<string> {
  const rawId = songIdWithPrefix.replace(/^saavn:/, "");
  if (streamCache.has(rawId)) {
    return streamCache.get(rawId)!;
  }

  const data = await callSaavn<any>({
    __call: "song.getDetails",
    pids: rawId,
  });

  const song = data?.songs?.[0] || (data && typeof data === "object" ? Object.values(data)[0] : null);
  const enc = song?.more_info?.encrypted_media_url;

  if (!enc) {
    throw new Error(`No audio stream found for track ${rawId}`);
  }

  const directUrl = decryptMediaUrl(enc);
  if (!directUrl) {
    throw new Error(`Failed to decrypt audio stream for track ${rawId}`);
  }

  streamCache.set(rawId, directUrl);
  return directUrl;
}

const PUNJABI_ARTISTS = [
  "karan aujla",
  "sidhu moose wala",
  "diljit dosanjh",
  "shubh",
  "ap dhillon",
  "amrit maan",
  "guru randhawa",
  "hardy sandhu",
  "b praak",
  "jassie gill",
  "parmish verma",
  "gurinder gill",
  "jordan sandhu",
  "mankirt aulakh",
  "tegi pannu",
  "tarsem jassar",
  "arjan dhillon",
  "chani nattan",
  "korala maan",
];

export async function getSaavnRecommendations(params: {
  artistName?: string;
  genre?: string;
  seedTitle?: string;
  excludeIds?: string[];
  userGenres?: string[];
  userArtists?: string[];
}): Promise<Track[]> {
  const exclude = new Set((params.excludeIds || []).map((id) => id.replace(/^saavn:/, "")));
  const artistLower = (params.artistName || "").toLowerCase();
  const genreLower = (params.genre || "").toLowerCase();
  const titleLower = (params.seedTitle || "").toLowerCase();

  const isPunjabi =
    genreLower.includes("punjabi") ||
    PUNJABI_ARTISTS.some((a) => artistLower.includes(a)) ||
    titleLower.includes("punjabi");

  const isHindi =
    genreLower.includes("hindi") ||
    genreLower.includes("bollywood") ||
    ["arijit singh", "atif aslam", "pritam", "shreya ghoshal", "jubin nautiyal", "badshah", "honey singh"].some(
      (a) => artistLower.includes(a),
    );

  const queryPromises: Promise<any>[] = [];

  // 1. Artist-specific top songs
  if (params.artistName) {
    queryPromises.push(
      callSaavn<any>({
        __call: "search.getResults",
        q: params.artistName,
        n: 15,
        p: 1,
      }),
    );
  }

  // 2. Genre / Taste hits
  if (isPunjabi) {
    queryPromises.push(
      callSaavn<any>({
        __call: "search.getResults",
        q: "punjabi top hits",
        n: 25,
        p: 1,
      }),
    );
    queryPromises.push(
      callSaavn<any>({
        __call: "search.getResults",
        q: "punjabi trending",
        n: 15,
        p: 1,
      }),
    );
  } else if (isHindi) {
    queryPromises.push(
      callSaavn<any>({
        __call: "search.getResults",
        q: "hindi top hits",
        n: 25,
        p: 1,
      }),
    );
  } else {
    queryPromises.push(
      callSaavn<any>({
        __call: "search.getResults",
        q: `${params.artistName || "trending"} hits`,
        n: 20,
        p: 1,
      }),
    );
  }

  // 3. Learned user taste profile infusion
  if (params.userGenres && params.userGenres.length > 0) {
    for (const g of params.userGenres.slice(0, 2)) {
      queryPromises.push(
        callSaavn<any>({
          __call: "search.getResults",
          q: `${g} top hits`,
          n: 15,
          p: 1,
        }),
      );
    }
  }

  if (params.userArtists && params.userArtists.length > 0) {
    for (const a of params.userArtists.slice(0, 2)) {
      if (a.toLowerCase() !== artistLower) {
        queryPromises.push(
          callSaavn<any>({
            __call: "search.getResults",
            q: a,
            n: 10,
            p: 1,
          }),
        );
      }
    }
  }

  const results = await Promise.all(queryPromises);
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const tracks: Track[] = [];

  for (const res of results) {
    const list: any[] = res?.results || [];
    for (const song of list) {
      if (!song?.id) continue;
      const songId = String(song.id);
      if (exclude.has(songId) || seenIds.has(songId)) continue;

      const titleNorm = (song.title || "")
        .toLowerCase()
        .replace(/\(.*?\)/g, "")
        .replace(/\[.*?\]/g, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();

      const seedNorm = (params.seedTitle || "")
        .toLowerCase()
        .replace(/\(.*?\)/g, "")
        .replace(/\[.*?\]/g, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();

      if (seedNorm && (titleNorm === seedNorm || titleNorm.includes(seedNorm) || seedNorm.includes(titleNorm))) continue;
      if (seenTitles.has(titleNorm)) continue;

      seenIds.add(songId);
      seenTitles.add(titleNorm);
      tracks.push(mapSaavnTrack(song));
    }
  }

  return tracks;
}
