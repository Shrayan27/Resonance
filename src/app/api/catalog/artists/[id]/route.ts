import { NextResponse } from "next/server";
import { getArtist } from "@/lib/audius";
import { getSaavnArtist } from "@/lib/saavn";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const decodedId = decodeURIComponent(id);
  try {
    if (decodedId.startsWith("saavn:") || /^\d+$/.test(decodedId)) {
      return NextResponse.json(await getSaavnArtist(decodedId));
    }
    return NextResponse.json(await getArtist(decodedId));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
