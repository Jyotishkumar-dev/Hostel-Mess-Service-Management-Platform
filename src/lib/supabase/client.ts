import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseUrl, getSupabaseAnonKey, assertSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Browser-side Supabase client.
 *
 * Uses the public (anon) key, which is safe to ship to the browser — Supabase
 * enforces access control through Row Level Security policies in the database.
 * The service-role key must never be used here or committed anywhere.
 *
 * Returns null if Supabase is not configured, allowing the UI to degrade
 * gracefully instead of throwing at module load time.
 */
export function createClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key) return null;

  return createBrowserClient(url, key);
}

/** Helper to check if the browser client can be created. */
export function canUseSupabase(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

/** Throw if Supabase is not configured — for use inside server actions. */
export function requireSupabaseClient() {
  assertSupabaseConfigured();
  const url = getSupabaseUrl()!;
  const key = getSupabaseAnonKey()!;
  return createBrowserClient(url, key);
}