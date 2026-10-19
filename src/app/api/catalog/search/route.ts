import { NextResponse, type NextRequest } from "next/server";
import { search } from "@/lib/audius";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ query: "", tracks: [], playlists: [], artists: [] });
  try {
    return NextResponse.json(await search(q));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
