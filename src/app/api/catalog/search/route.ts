import { NextResponse, type NextRequest } from "next/server";
import { search as searchAudius } from "@/lib/audius";
import { searchSaavn } from "@/lib/saavn";
import { searchCommunityPlaylists } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ query: "", tracks: [], playlists: [], artists: [] });

  try {
    // Query both Saavn (commercial original tracks) and Audius concurrently
    const [saavnRes, audiusRes] = await Promise.allSettled([
      searchSaavn(q),
      searchAudius(q),
    ]);

    const saavn = saavnRes.status === "fulfilled" ? saavnRes.value : { tracks: [], artists: [], playlists: [] };
    const audius = audiusRes.status === "fulfilled" ? audiusRes.value : { tracks: [], artists: [], playlists: [] };

    // Deduplicate and prioritize Saavn original tracks
    const trackIds = new Set<string>();
    const combinedTracks = [];
    for (const t of [...saavn.tracks, ...audius.tracks]) {
      if (!trackIds.has(t.id)) {
        trackIds.add(t.id);
        combinedTracks.push(t);
      }
    }

    const artistNames = new Set<string>();
    const combinedArtists = [];
    for (const a of [...saavn.artists, ...audius.artists]) {
      const lower = a.name.toLowerCase();
      if (!artistNames.has(lower)) {
        artistNames.add(lower);
        combinedArtists.push(a);
      }
    }

    const playlistTitles = new Set<string>();
    const combinedPlaylists = [];

    // Add community created playlists first
    const communityPlaylists = searchCommunityPlaylists(q);
    for (const cp of communityPlaylists) {
      playlistTitles.add(cp.name.toLowerCase());
      combinedPlaylists.push({
        id: `user:${cp.id}`,
        kind: "playlist" as const,
        title: cp.name,
        description: cp.description,
        owner: {
          id: cp.creatorId || "",
          name: cp.creatorName ? `Created by ${cp.creatorName}` : "Community",
        },
        artwork: cp.tracks[0]?.artworkLarge || cp.tracks[0]?.artwork || "",
        artworkLarge: cp.tracks[0]?.artworkLarge || cp.tracks[0]?.artwork || "",
        trackCount: cp.tracks.length,
      });
    }

    for (const p of [...saavn.playlists, ...audius.playlists]) {
      const lower = p.title.toLowerCase();
      if (!playlistTitles.has(lower)) {
        playlistTitles.add(lower);
        combinedPlaylists.push(p);
      }
    }

    return NextResponse.json({
      query: q,
      tracks: combinedTracks,
      artists: combinedArtists,
      playlists: combinedPlaylists,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
