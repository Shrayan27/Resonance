import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

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
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "resonance.json");

const AVATAR_GRADIENTS = [
  "from-emerald-400 to-teal-600",
  "from-purple-500 to-indigo-600",
  "from-pink-500 to-rose-600",
  "from-amber-400 to-orange-600",
  "from-cyan-400 to-blue-600",
  "from-violet-500 to-fuchsia-600",
];

function ensureDb(): DatabaseSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initial: DatabaseSchema = { users: [], sessions: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }

  try {
    const content = fs.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(content);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch {
    const fallback: DatabaseSchema = { users: [], sessions: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

function saveDb(data: DatabaseSchema) {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tempFile, DB_FILE);
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
  return session;
}

export function deleteSession(token: string) {
  const db = ensureDb();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  saveDb(db);
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
  return user.taste;
}
