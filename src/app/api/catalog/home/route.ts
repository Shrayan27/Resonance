import { NextResponse } from "next/server";
import { getHome } from "@/lib/audius";

export async function GET() {
  try {
    return NextResponse.json(await getHome());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
