import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tuozousxzingvdspfhue.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1b3pvdXN4emluZ3Zkc3BmaHVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNzQ3MjMsImV4cCI6MjEwODY1MDcyM30.jctjVCsajwLN2PBtCfYjDidYoYJVIW0nyA0lOCOHsXI";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrate() {
  const jsonPath = path.join(process.cwd(), "data", "resonance.json");
  if (!fs.existsSync(jsonPath)) {
    console.log("No resonance.json found, skipping.");
    return;
  }

  const content = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  // 1. Migrate Users
  if (Array.isArray(content.users) && content.users.length > 0) {
    for (const u of content.users) {
      const row = {
        id: u.id,
        name: u.name,
        email: u.email,
        password_hash: u.passwordHash,
        salt: u.salt,
        avatar_color: u.avatarColor,
        taste: u.taste || {},
        liked: u.liked || [],
        created_at: u.createdAt,
      };
      const { error } = await supabase.from("user_accounts").upsert(row);
      if (error) console.error("Error migrating user:", u.email, error.message);
      else console.log("Migrated user:", u.email);
    }
  }

  // 2. Migrate Playlists
  if (Array.isArray(content.playlists) && content.playlists.length > 0) {
    for (const p of content.playlists) {
      const row = {
        id: p.id,
        name: p.name,
        description: p.description || null,
        creator_id: p.creatorId || null,
        creator_name: p.creatorName || null,
        is_public: p.isPublic ?? true,
        tracks: p.tracks || [],
        created_at: p.createdAt || Date.now(),
        updated_at: p.updatedAt || Date.now(),
      };
      const { error } = await supabase.from("playlists").upsert(row);
      if (error) console.error("Error migrating playlist:", p.name, error.message);
      else console.log("Migrated playlist:", p.name);
    }
  }

  // 3. Migrate Sessions
  if (Array.isArray(content.sessions) && content.sessions.length > 0) {
    for (const s of content.sessions) {
      const row = {
        token: s.token,
        user_id: s.userId,
        created_at: s.createdAt,
        expires_at: s.expiresAt,
      };
      const { error } = await supabase.from("sessions").upsert(row);
      if (error) console.error("Error migrating session:", s.token, error.message);
      else console.log("Migrated session for:", s.userId);
    }
  }

  console.log("Migration complete!");
}

migrate();
