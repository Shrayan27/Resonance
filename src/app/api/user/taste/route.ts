import { NextResponse } from "next/server";
import { getSessionUserRaw } from "@/lib/auth-server";
import { updateUserPreferences } from "@/lib/db";

export async function GET() {
  const user = await getSessionUserRaw();
  if (!user) {
    return NextResponse.json({ taste: null }, { status: 401 });
  }
  return NextResponse.json({ taste: user.taste });
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUserRaw();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { preferredGenres, preferredArtists } = body;

    const taste = updateUserPreferences(user.id, {
      preferredGenres,
      preferredArtists,
    });

    return NextResponse.json({ taste });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
