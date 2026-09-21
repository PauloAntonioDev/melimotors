import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    : null;

export const isSupabaseConfigured = Boolean(supabase);

export function publicStorageUrl(path?: string | null): string {
  if (!path) return "/melimotors-showroom.png";
  if (!supabase) return path;
  return supabase.storage.from("vehicle-images").getPublicUrl(path).data.publicUrl;
}
