import { createClient } from "@supabase/supabase-js";

const meta = import.meta as any;
const supabaseUrl = (meta.env?.VITE_SUPABASE_URL as string) || "";
const supabaseAnonKey = (meta.env?.VITE_SUPABASE_ANON_KEY as string) || "";

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!supabase;
}
