import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tuozousxzingvdspfhue.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1b3pvdXN4emluZ3Zkc3BmaHVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNzQ3MjMsImV4cCI6MjEwODY1MDcyM30.jctjVCsajwLN2PBtCfYjDidYoYJVIW0nyA0lOCOHsXI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});
