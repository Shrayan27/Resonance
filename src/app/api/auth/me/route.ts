import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-server";

export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
