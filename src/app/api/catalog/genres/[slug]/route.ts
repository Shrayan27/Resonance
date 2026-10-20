import { NextResponse, type NextRequest } from "next/server";
import { getGenreTracks } from "@/lib/audius";
import { genreBySlug } from "@/lib/genres";

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const genre = genreBySlug(slug);
  if (!genre) return NextResponse.json({ error: "Unknown genre" }, { status: 404 });
  const offset = Math.max(0, Number(req.nextUrl.searchParams.get("offset")) || 0);
  const limit = Math.min(60, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 40));
  const time = req.nextUrl.searchParams.get("time") ?? undefined;
  try {
    const tracks = await getGenreTracks(genre.name, offset, limit, time);
    return NextResponse.json({ genre: genre.name, offset, tracks });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
