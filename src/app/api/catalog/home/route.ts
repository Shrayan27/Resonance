import { NextResponse } from "next/server";
import { getHome } from "@/lib/audius";
import { getRecentCommunityPlaylists } from "@/lib/db";

export async function GET() {
  try {
    const home = await getHome();
    const communityPlaylists = getRecentCommunityPlaylists(12);
    return NextResponse.json({
      ...home,
      communityPlaylists,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
