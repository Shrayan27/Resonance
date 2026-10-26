import { NextResponse } from "next/server";
import { getPlaylist } from "@/lib/audius";
import { getSaavnAlbum } from "@/lib/saavn";
import { getPlaylistById } from "@/lib/db";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const decodedId = decodeURIComponent(id);
  try {
    if (decodedId.startsWith("user:") || decodedId.startsWith("pl_")) {
      const userPlaylist = getPlaylistById(decodedId);
      if (userPlaylist) {
        return NextResponse.json({
          collection: {
            id: `user:${userPlaylist.id}`,
            kind: "playlist",
            title: userPlaylist.name,
            description: userPlaylist.description,
            owner: {
              id: userPlaylist.creatorId || "",
              name: userPlaylist.creatorName ? `Created by ${userPlaylist.creatorName}` : "Community",
            },
            artwork: userPlaylist.tracks[0]?.artworkLarge || userPlaylist.tracks[0]?.artwork || "",
            artworkLarge: userPlaylist.tracks[0]?.artworkLarge || userPlaylist.tracks[0]?.artwork || "",
            trackCount: userPlaylist.tracks.length,
          },
          tracks: userPlaylist.tracks,
        });
      }
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }
    if (decodedId.startsWith("saavn:")) {
      return NextResponse.json(await getSaavnAlbum(decodedId));
    }
    return NextResponse.json(await getPlaylist(decodedId));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
