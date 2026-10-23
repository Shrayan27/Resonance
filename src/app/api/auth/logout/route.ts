import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession } from "@/lib/db";
import { SESSION_COOKIE_NAME } from "@/lib/auth-server";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    deleteSession(token);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);

  return NextResponse.json({ message: "Logged out successfully" });
}
