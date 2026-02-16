import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "/utils/supabase/info";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = `https://${projectId}.supabase.co`;
    supabaseInstance = createClient(supabaseUrl, publicAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseInstance;
}
