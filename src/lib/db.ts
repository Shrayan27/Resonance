import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { supabase } from "./supabase";
import type { Collection, Track, UserPlaylist } from "./types";

export interface UserTaste {
  preferredGenres: string[];
  preferredArtists: string[];
  genreWeights: Record<string, number>;
  artistWeights: Record<string, number>;
  totalPlays: number;
  lastUpdated: number;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  avatarColor: string;
  createdAt: number;
  taste: UserTaste;
  liked?: Track[];
}

export interface Session {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

interface DatabaseSchema {
  users: UserAccount[];
  sessions: Session[];
  playlists: UserPlaylist[];
}

const DB_DIR = process.env.VERCEL
  ? path.join("/tmp", "resonance-data")
  : path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "resonance.json");

let memoryFallbackDb: DatabaseSchema = { users: [], sessions: [], playlists: [] };

let isHydrated = false;
export async function hydrateFromSupabase() {
  if (isHydrated) return;
  try {
    const [uRes, pRes, sRes] = await Promise.all([
      supabase.from("user_accounts").select("*"),
      supabase.from("playlists").select("*"),
      supabase.from("sessions").select("*"),
    ]);

    if (uRes.data && uRes.data.length > 0) {
      memoryFallbackDb.users = uRes.data.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: u.password_hash,
        salt: u.salt,
        avatarColor: u.avatar_color,
        createdAt: Number(u.created_at),
        taste: u.taste || {
          preferredGenres: [],
          preferredArtists: [],
          genreWeights: {},
          artistWeights: {},
          totalPlays: 0,
          lastUpdated: Date.now(),
        },
        liked: u.liked || [],
      }));
    }

    if (pRes.data && pRes.data.length > 0) {
      memoryFallbackDb.playlists = pRes.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description || undefined,
        creatorId: p.creator_id || undefined,
        creatorName: p.creator_name || undefined,
        isPublic: p.is_public ?? true,
        trackIds: Array.isArray(p.tracks) ? p.tracks.map((t: any) => t.id) : [],
        tracks: Array.isArray(p.tracks) ? p.tracks : [],
        createdAt: Number(p.created_at),
        updatedAt: Number(p.updated_at),
      }));
    }

    if (sRes.data && sRes.data.length > 0) {
      memoryFallbackDb.sessions = sRes.data.map((s: any) => ({
        token: s.token,
        userId: s.user_id,
        createdAt: Number(s.created_at),
        expiresAt: Number(s.expires_at),
      }));
    }

    isHydrated = true;
  } catch (err) {
    console.error("Supabase hydration error:", err);
  }
}

function bgSync(p: any) {
  Promise.resolve(p).catch((err) => {
    console.error("Supabase sync background error:", err);
  });
}

// Background initial hydration
bgSync(hydrateFromSupabase());

const AVATAR_GRADIENTS = [
  "from-emerald-400 to-teal-600",
  "from-purple-500 to-indigo-600",
  "from-pink-500 to-rose-600",
  "from-amber-400 to-orange-600",
  "from-cyan-400 to-blue-600",
  "from-violet-500 to-fuchsia-600",
];

function ensureDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseSchema = { users: [], sessions: [], playlists: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf8");
      memoryFallbackDb = initial;
      return initial;
    }

    const content = fs.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(content);
    const data: DatabaseSchema = {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      playlists: Array.isArray(parsed.playlists) ? parsed.playlists : [],
    };
    memoryFallbackDb = data;
    return data;
  } catch {
    return memoryFallbackDb;
  }
}

function saveDb(data: DatabaseSchema) {
  memoryFallbackDb = data;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(tempFile, DB_FILE);
  } catch {
    // If filesystem is read-only, in-memory state is preserved
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export function sanitizeUser(user: UserAccount) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, salt, ...safe } = user;
  return safe;
}

export function findUserByEmail(email: string): UserAccount | null {
  const db = ensureDb();
  const cleanEmail = email.toLowerCase().trim();
  return db.users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
}

export function findUserById(id: string): UserAccount | null {
  const db = ensureDb();
  return db.users.find((u) => u.id === id) || null;
}

export function getUserPublicProfile(id: string) {
  const db = ensureDb();
  const user = db.users.find((u) => u.id === id);
  if (!user) return null;
  const publicPlaylists = (db.playlists || []).filter(
    (p) => p.creatorId === id && p.isPublic !== false,
  );
  return {
    id: user.id,
    name: user.name,
    avatarColor: user.avatarColor,
    createdAt: user.createdAt,
    preferredGenres: user.taste?.preferredGenres || [],
    playlists: publicPlaylists,
  };
}

export function createUser(data: {
  name: string;
  email: string;
  password: string;
  preferredGenres?: string[];
}): UserAccount {
  const db = ensureDb();
  const cleanEmail = data.email.toLowerCase().trim();

  if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    throw new Error("An account with this email already exists");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(data.password, salt);
  const id = `usr_${crypto.randomBytes(6).toString("hex")}`;
  const avatarColor = AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)];

  const initialGenres = (data.preferredGenres || []).map((g) => g.toLowerCase().trim()).filter(Boolean);
  const initialWeights: Record<string, number> = {};
  initialGenres.forEach((g) => {
    initialWeights[g] = 5; // Initial affinity weight
  });

  const newUser: UserAccount = {
    id,
    name: data.name.trim() || "Music Lover",
    email: cleanEmail,
    passwordHash,
    salt,
    avatarColor,
    createdAt: Date.now(),
    taste: {
      preferredGenres: initialGenres,
      preferredArtists: [],
      genreWeights: initialWeights,
      artistWeights: {},
      totalPlays: 0,
      lastUpdated: Date.now(),
    },
  };

  db.users.push(newUser);
  saveDb(db);

  bgSync(
    supabase.from("user_accounts").upsert({
      id,
      name: newUser.name,
      email: newUser.email,
      password_hash: passwordHash,
      salt,
      avatar_color: avatarColor,
      taste: newUser.taste,
      liked: [],
      created_at: newUser.createdAt,
    })
  );

  return newUser;
}

export function authenticateUser(email: string, password: string): UserAccount | null {
  const user = findUserByEmail(email);
  if (!user) return null;

  const testHash = hashPassword(password, user.salt);
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(user.passwordHash, "hex"),
    Buffer.from(testHash, "hex"),
  );

  return isMatch ? user : null;
}

export function createSession(userId: string): Session {
  const db = ensureDb();
  const token = `res_${crypto.randomBytes(32).toString("hex")}`;
  const session: Session = {
    token,
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  // Clean expired sessions
  db.sessions = db.sessions.filter((s) => s.expiresAt > Date.now());
  db.sessions.push(session);
  saveDb(db);

  bgSync(
    supabase.from("sessions").upsert({
      token,
      user_id: userId,
      created_at: session.createdAt,
      expires_at: session.expiresAt,
    })
  );

  return session;
}

export function deleteSession(token: string) {
  const db = ensureDb();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  saveDb(db);

  bgSync(supabase.from("sessions").delete().eq("token", token));
}

export function getUserFromSession(token?: string | null): UserAccount | null {
  if (!token) return null;
  const db = ensureDb();
  const session = db.sessions.find((s) => s.token === token && s.expiresAt > Date.now());
  if (!session) return null;
  return db.users.find((u) => u.id === session.userId) || null;
}

export function recordUserListen(
  userId: string,
  track: { id: string; title: string; artist?: string; genre?: string },
): UserTaste | null {
  const db = ensureDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;

  const taste = user.taste || {
    preferredGenres: [],
    preferredArtists: [],
    genreWeights: {},
    artistWeights: {},
    totalPlays: 0,
    lastUpdated: Date.now(),
  };

  taste.totalPlays = (taste.totalPlays || 0) + 1;
  taste.lastUpdated = Date.now();

  // Normalize and record artist
  const artist = (track.artist || "").toLowerCase().trim();
  if (artist && artist !== "unknown artist") {
    taste.artistWeights[artist] = (taste.artistWeights[artist] || 0) + 1;
  }

  // Detect and record genre
  let detectedGenre = (track.genre || "").toLowerCase().trim();
  const titleLower = track.title.toLowerCase();

  if (!detectedGenre || detectedGenre === "unknown") {
    if (
      artist.includes("aujla") ||
      artist.includes("sidhu") ||
      artist.includes("diljit") ||
      artist.includes("shubh") ||
      titleLower.includes("punjabi")
    ) {
      detectedGenre = "punjabi";
    } else if (
      artist.includes("arijit") ||
      artist.includes("pritam") ||
      artist.includes("shreya") ||
      artist.includes("atif")
    ) {
      detectedGenre = "hindi bollywood";
    } else if (artist.includes("abdul hannan") || titleLower.includes("lofi") || titleLower.includes("lo-fi")) {
      detectedGenre = "indie & lo-fi";
    } else {
      detectedGenre = "pop";
    }
  }

  taste.genreWeights[detectedGenre] = (taste.genreWeights[detectedGenre] || 0) + 1;

  // Keep top genres updated
  const sortedGenres = Object.entries(taste.genreWeights)
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g);

  const merged = Array.from(new Set([...taste.preferredGenres, ...sortedGenres]));
  taste.preferredGenres = merged.slice(0, 5);

  user.taste = taste;
  saveDb(db);

  bgSync(supabase.from("user_accounts").update({ taste: user.taste }).eq("id", userId));

  return taste;
}

export function updateUserPreferences(
  userId: string,
  prefs: { preferredGenres?: string[]; preferredArtists?: string[] },
): UserTaste | null {
  const db = ensureDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;

  if (prefs.preferredGenres) {
    const cleanGenres = prefs.preferredGenres.map((g) => g.toLowerCase().trim()).filter(Boolean);
    user.taste.preferredGenres = cleanGenres;
    cleanGenres.forEach((g) => {
      user.taste.genreWeights[g] = Math.max(user.taste.genreWeights[g] || 0, 5);
    });
  }

  if (prefs.preferredArtists) {
    const cleanArtists = prefs.preferredArtists.map((a) => a.toLowerCase().trim()).filter(Boolean);
    user.taste.preferredArtists = cleanArtists;
    cleanArtists.forEach((a) => {
      user.taste.artistWeights[a] = Math.max(user.taste.artistWeights[a] || 0, 5);
    });
  }

  user.taste.lastUpdated = Date.now();
  saveDb(db);

  bgSync(supabase.from("user_accounts").update({ taste: user.taste }).eq("id", userId));

  return user.taste;
}

export function createCommunityPlaylist(data: {
  name: string;
  description?: string;
  creatorId: string;
  creatorName: string;
  firstTrack?: Track;
  tracks?: Track[];
  isPublic?: boolean;
}): UserPlaylist {
  const db = ensureDb();
  const id = `pl_${crypto.randomBytes(6).toString("hex")}`;
  const tracks = data.tracks || (data.firstTrack ? [data.firstTrack] : []);
  const playlist: UserPlaylist = {
    id,
    name: data.name.trim() || "Untitled Playlist",
    description: data.description?.trim(),
    creatorId: data.creatorId,
    creatorName: data.creatorName || "Music Lover",
    isPublic: data.isPublic ?? true,
    trackIds: tracks.map((t) => t.id),
    tracks,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  db.playlists = [playlist, ...(db.playlists || [])];
  saveDb(db);

  bgSync(
    supabase.from("playlists").upsert({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description || null,
      creator_id: playlist.creatorId || null,
      creator_name: playlist.creatorName || null,
      is_public: playlist.isPublic,
      tracks: playlist.tracks,
      created_at: playlist.createdAt,
      updated_at: playlist.updatedAt,
    })
  );

  return playlist;
}

export function getPlaylistById(id: string): UserPlaylist | null {
  const db = ensureDb();
  const cleanId = id.replace(/^user:/, "");
  return db.playlists.find((p) => p.id === cleanId) || null;
}

export function getUserPlaylists(userId: string): UserPlaylist[] {
  const db = ensureDb();
  return (db.playlists || []).filter((p) => p.creatorId === userId);
}

export function searchCommunityPlaylists(query: string): UserPlaylist[] {
  const db = ensureDb();
  const q = (query || "").toLowerCase().trim();
  if (!q) return [];
  return (db.playlists || []).filter((p) => {
    if (!p || p.isPublic === false) return false;
    if (p.name && p.name.toLowerCase().includes(q)) return true;
    if (p.creatorName && p.creatorName.toLowerCase().includes(q)) return true;
    if (p.description && p.description.toLowerCase().includes(q)) return true;
    return false;
  });
}

export function getRecentCommunityPlaylists(limit = 12): Collection[] {
  const db = ensureDb();
  const publicPlaylists = (db.playlists || [])
    .filter((p) => p && p.isPublic !== false && p.tracks && p.tracks.length > 0)
    .slice(0, limit);

  return publicPlaylists.map((cp) => ({
    id: `user:${cp.id}`,
    kind: "playlist" as const,
    title: cp.name,
    description: cp.description,
    owner: {
      id: cp.creatorId || "",
      name: cp.creatorName ? `Created by ${cp.creatorName}` : "Community",
    },
    artwork: cp.tracks[0]?.artworkLarge || cp.tracks[0]?.artwork || "",
    artworkLarge: cp.tracks[0]?.artworkLarge || cp.tracks[0]?.artwork || "",
    trackCount: cp.tracks.length,
  }));
}

export function updateCommunityPlaylist(
  id: string,
  requesterUserId: string,
  updates: {
    name?: string;
    description?: string;
    tracks?: Track[];
    isPublic?: boolean;
  },
): UserPlaylist | null {
  const db = ensureDb();
  const cleanId = id.replace(/^user:/, "");
  const playlist = db.playlists.find((p) => p.id === cleanId);
  if (!playlist) return null;

  if (playlist.creatorId && playlist.creatorId !== requesterUserId) {
    throw new Error("Forbidden: You do not own this playlist");
  }

  if (updates.name !== undefined) playlist.name = updates.name.trim() || playlist.name;
  if (updates.description !== undefined) playlist.description = updates.description.trim();
  if (updates.tracks !== undefined) {
    playlist.tracks = updates.tracks;
    playlist.trackIds = updates.tracks.map((t) => t.id);
  }
  if (updates.isPublic !== undefined) playlist.isPublic = updates.isPublic;
  playlist.updatedAt = Date.now();

  saveDb(db);

  bgSync(
    supabase
      .from("playlists")
      .update({
        name: playlist.name,
        description: playlist.description || null,
        is_public: playlist.isPublic,
        tracks: playlist.tracks,
        updated_at: playlist.updatedAt,
      })
      .eq("id", cleanId)
  );

  return playlist;
}

export function deleteCommunityPlaylist(id: string, requesterUserId: string): boolean {
  const db = ensureDb();
  const cleanId = id.replace(/^user:/, "");
  const playlist = db.playlists.find((p) => p.id === cleanId);
  if (!playlist) return false;

  if (playlist.creatorId && playlist.creatorId !== requesterUserId) {
    throw new Error("Forbidden: You do not own this playlist");
  }

  db.playlists = db.playlists.filter((p) => p.id !== cleanId);
  saveDb(db);

  bgSync(supabase.from("playlists").delete().eq("id", cleanId));

  return true;
}

export function getUserLikedTracks(userId: string): Track[] {
  const db = ensureDb();
  const user = db.users.find((u) => u.id === userId);
  return user?.liked || [];
}

export function toggleUserLikedTrack(userId: string, track: Track): Track[] {
  const db = ensureDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return [];
  const current = user.liked || [];
  const exists = current.some((t) => t.id === track.id);
  user.liked = exists ? current.filter((t) => t.id !== track.id) : [track, ...current];
  saveDb(db);

  bgSync(supabase.from("user_accounts").update({ liked: user.liked }).eq("id", userId));

  return user.liked;
}
