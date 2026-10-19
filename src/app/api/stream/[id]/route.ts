import { NextResponse } from "next/server";
import { resolveStreamUrl } from "@/lib/audius";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const url = await resolveStreamUrl(id);
    return NextResponse.redirect(url, 302);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
