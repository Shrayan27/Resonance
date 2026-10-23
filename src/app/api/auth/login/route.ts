import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticateUser, createSession, sanitizeUser } from "@/lib/db";
import { SESSION_COOKIE_NAME } from "@/lib/auth-server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = authenticateUser(email, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const session = createSession(user.id);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return NextResponse.json({
      user: sanitizeUser(user),
      message: "Logged in successfully",
    });
  } catch (err) {
    const message = (err as Error).message || "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
