import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-server";
import { getUserLikedTracks, toggleUserLikedTrack } from "@/lib/db";
import type { Track } from "@/lib/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ liked: [] });
  }

  const liked = getUserLikedTracks(user.id);
  return NextResponse.json({ liked });
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { track } = body as { track: Track };
    if (!track?.id) {
      return NextResponse.json({ error: "Track missing" }, { status: 400 });
    }

    const liked = toggleUserLikedTrack(user.id, track);
    return NextResponse.json({ liked });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
