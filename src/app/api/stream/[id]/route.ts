import { NextResponse } from "next/server";
import { resolveStreamUrl } from "@/lib/audius";
import { resolveSaavnStreamUrl } from "@/lib/saavn";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const decodedId = decodeURIComponent(id);

  try {
    const targetUrl = decodedId.startsWith("saavn:")
      ? await resolveSaavnStreamUrl(decodedId)
      : await resolveStreamUrl(decodedId);

    if (!targetUrl) {
      return NextResponse.json({ error: "Stream URL not found" }, { status: 404 });
    }

    // Direct redirect to the high-speed CDN stream URL.
    // This allows mobile browsers (iOS & Android) to stream with native HTTP 206 Range requests,
    // buffer ahead, and keep playing continuously in the background when the phone is locked,
    // completely eliminating Vercel serverless function timeouts.
    return NextResponse.redirect(targetUrl, 307);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

export async function HEAD(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return GET(req, ctx);
}
