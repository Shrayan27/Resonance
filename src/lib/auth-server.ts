import { cookies } from "next/headers";
import { getUserFromSession, sanitizeUser } from "./db";

export const SESSION_COOKIE_NAME = "resonance_session";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const user = getUserFromSession(token);
  return user ? sanitizeUser(user) : null;
}

export async function getSessionUserRaw() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return getUserFromSession(token);
}
