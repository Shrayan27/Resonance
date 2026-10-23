import { NextResponse } from "next/server";
import { resolveStreamUrl } from "@/lib/audius";
import { resolveSaavnStreamUrl } from "@/lib/saavn";

export const maxDuration = 60;

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const decodedId = decodeURIComponent(id);

  try {
    const targetUrl = decodedId.startsWith("saavn:")
      ? await resolveSaavnStreamUrl(decodedId)
      : await resolveStreamUrl(decodedId);

    const rangeHeader = req.headers.get("range");
    const fetchHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    if (rangeHeader) {
      fetchHeaders["Range"] = rangeHeader;
    }

    const res = await fetch(targetUrl, {
      headers: fetchHeaders,
      redirect: "follow",
    });

    if (!res.ok && res.status !== 206) {
      return NextResponse.redirect(targetUrl, 302);
    }

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", res.headers.get("content-type") || "audio/mp4");
    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Headers", "Range, Accept-Encoding");
    responseHeaders.set("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges, ETag, Last-Modified");
    responseHeaders.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");

    const etag = res.headers.get("etag");
    if (etag) responseHeaders.set("ETag", etag);

    const lastModified = res.headers.get("last-modified");
    if (lastModified) responseHeaders.set("Last-Modified", lastModified);

    const contentRange = res.headers.get("content-range");
    if (contentRange) {
      responseHeaders.set("Content-Range", contentRange);
    }

    const contentLength = res.headers.get("content-length");
    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

export async function HEAD(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return GET(req, ctx);
}
