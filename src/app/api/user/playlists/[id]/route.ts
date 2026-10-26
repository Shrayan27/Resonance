import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-server";
import {
  deleteCommunityPlaylist,
  getPlaylistById,
  updateCommunityPlaylist,
} from "@/lib/db";
import type { Track } from "@/lib/types";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const playlist = getPlaylistById(id);
  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }
  return NextResponse.json({ playlist });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const body = await req.json();
    const { name, description, tracks, isPublic } = body as {
      name?: string;
      description?: string;
      tracks?: Track[];
      isPublic?: boolean;
    };

    const playlist = updateCommunityPlaylist(id, user.id, {
      name,
      description,
      tracks,
      isPublic,
    });

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    return NextResponse.json({ playlist });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const ok = deleteCommunityPlaylist(id, user.id);
    if (!ok) {
      return NextResponse.json({ error: "Playlist not found or forbidden" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
