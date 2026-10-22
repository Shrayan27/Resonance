import { NextResponse } from "next/server";
import { getPlaylist } from "@/lib/audius";
import { getSaavnAlbum } from "@/lib/saavn";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const decodedId = decodeURIComponent(id);
  try {
    if (decodedId.startsWith("saavn:")) {
      return NextResponse.json(await getSaavnAlbum(decodedId));
    }
    return NextResponse.json(await getPlaylist(decodedId));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
