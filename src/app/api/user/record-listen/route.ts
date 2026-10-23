import { NextResponse } from "next/server";
import { getSessionUserRaw } from "@/lib/auth-server";
import { recordUserListen } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const user = await getSessionUserRaw();
    if (!user) {
      return NextResponse.json({ message: "Guest play recorded locally" });
    }

    const body = await req.json();
    const { track } = body;

    if (!track || !track.id) {
      return NextResponse.json({ error: "Track data required" }, { status: 400 });
    }

    const updatedTaste = recordUserListen(user.id, {
      id: track.id,
      title: track.title,
      artist: track.artist?.name,
      genre: track.genre,
    });

    return NextResponse.json({ taste: updatedTaste });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
