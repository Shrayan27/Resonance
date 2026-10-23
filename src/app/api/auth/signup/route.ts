import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createUser, createSession, sanitizeUser } from "@/lib/db";
import { SESSION_COOKIE_NAME } from "@/lib/auth-server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, preferredGenres } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    const user = createUser({
      name,
      email,
      password,
      preferredGenres: Array.isArray(preferredGenres) ? preferredGenres : [],
    });

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
      message: "Account created successfully",
    });
  } catch (err) {
    const message = (err as Error).message || "Signup failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
