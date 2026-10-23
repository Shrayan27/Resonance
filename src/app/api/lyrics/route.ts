import { NextResponse } from "next/server";
import { cleanTrackTitle, parseLrc } from "@/lib/lyrics";
import type { LyricsResult } from "@/lib/types";

const LRCLIB_URL = "https://lrclib.net/api";
const USER_AGENT = "Resonance-MusicPlayer/1.0 (https://github.com/Shrayan27/Resonance)";

interface LrclibRecord {
  id?: number;
  trackName?: string;
  artistName?: string;
  duration?: number;
  instrumental?: boolean;
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
}

async function fetchLrclib(endpoint: string, params: Record<string, string>): Promise<unknown | null> {
  const url = new URL(`${LRCLIB_URL}${endpoint}`);
  for (const [key, val] of Object.entries(params)) {
    if (val) url.searchParams.set(key, val);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
      next: { revalidate: 86400 }, // Cache 24 hours
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawTitle = searchParams.get("title")?.trim() ?? "";
  const artist = searchParams.get("artist")?.trim() ?? "";
  const durationStr = searchParams.get("duration");
  const duration = durationStr ? Math.round(parseFloat(durationStr)) : undefined;

  if (!rawTitle) {
    return NextResponse.json({ error: "Missing track title" }, { status: 400 });
  }

  const cleanTitle = cleanTrackTitle(rawTitle);

  let record: LrclibRecord | null = null;

  // 1. Try exact lookup with clean title and artist
  if (artist) {
    const getParams: Record<string, string> = {
      track_name: cleanTitle,
      artist_name: artist,
    };
    if (duration && duration > 0) {
      getParams.duration = String(duration);
    }
    const data = (await fetchLrclib("/get", getParams)) as LrclibRecord | null;
    if (data && (data.syncedLyrics || data.plainLyrics || data.instrumental)) {
      record = data;
    }
  }

  // 2. If not found and rawTitle differed, try raw title
  if (!record && artist && rawTitle !== cleanTitle) {
    const data = (await fetchLrclib("/get", {
      track_name: rawTitle,
      artist_name: artist,
    })) as LrclibRecord | null;
    if (data && (data.syncedLyrics || data.plainLyrics || data.instrumental)) {
      record = data;
    }
  }

  // 3. Fallback: Search endpoint (fuzzy search)
  if (!record) {
    const searchQuery = artist ? `${artist} ${cleanTitle}` : cleanTitle;
    const searchResults = (await fetchLrclib("/search", { q: searchQuery })) as LrclibRecord[] | null;

    if (Array.isArray(searchResults) && searchResults.length > 0) {
      // Prioritize synced lyrics, or first with plain lyrics
      const best =
        searchResults.find((r) => r.syncedLyrics) ||
        searchResults.find((r) => r.plainLyrics) ||
        searchResults.find((r) => r.instrumental) ||
        searchResults[0];
      if (best && (best.syncedLyrics || best.plainLyrics || best.instrumental)) {
        record = best;
      }
    }
  }

  if (!record) {
    const emptyResult: LyricsResult = {
      synced: false,
      instrumental: false,
      lines: [],
      plain: "",
    };
    return NextResponse.json(emptyResult, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  }

  const isInstrumental = !!record.instrumental;
  const syncedLyrics = record.syncedLyrics;
  const plainLyrics = record.plainLyrics;

  if (syncedLyrics) {
    const lines = parseLrc(syncedLyrics);
    const result: LyricsResult = {
      synced: true,
      instrumental: isInstrumental,
      lines,
      plain: plainLyrics ?? undefined,
      source: "lrclib",
    };
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  }

  const result: LyricsResult = {
    synced: false,
    instrumental: isInstrumental,
    lines: [],
    plain: plainLyrics ?? "",
    source: "lrclib",
  };

  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
