import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-server";
import { createCommunityPlaylist, getUserPlaylists } from "@/lib/db";
import type { Track } from "@/lib/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ playlists: [] });
  }

  const playlists = getUserPlaylists(user.id);
  return NextResponse.json({ playlists });
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    const body = await req.json();
    const { name, description, firstTrack, tracks, isPublic } = body as {
      name?: string;
      description?: string;
      firstTrack?: Track;
      tracks?: Track[];
      isPublic?: boolean;
    };

    const creatorId = user ? user.id : "guest";
    const creatorName = user ? user.name : "Guest";

    const playlist = createCommunityPlaylist({
      name: name || "My Playlist",
      description,
      creatorId,
      creatorName,
      firstTrack,
      tracks,
      isPublic: isPublic ?? true,
    });

    return NextResponse.json({ playlist });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
