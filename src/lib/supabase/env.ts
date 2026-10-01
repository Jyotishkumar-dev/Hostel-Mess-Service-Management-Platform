/**
 * Supabase environment configuration.
 *
 * Reads NEXT_PUBLIC_* variables once and exposes them safely.
 * When the variables are not set, the application degrades gracefully:
 * - Auth forms show a "Supabase not configured" notice instead of crashing.
 * - Protected routes redirect to /login (which will show the notice).
 * - The production build succeeds without real credentials.
 */

let urlCache: string | undefined;
let keyCache: string | undefined;
let configuredCache: boolean | undefined;

/** Get the Supabase project URL (may be undefined if not configured). */
export function getSupabaseUrl(): string | undefined {
  if (urlCache !== undefined) return urlCache;
  urlCache = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (urlCache === "") urlCache = undefined;
  return urlCache;
}

/** Get the Supabase anon key (may be undefined if not configured). */
export function getSupabaseAnonKey(): string | undefined {
  if (keyCache !== undefined) return keyCache;
  keyCache = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (keyCache === "") keyCache = undefined;
  return keyCache;
}

/** Check if both required variables are present. */
export function isSupabaseConfigured(): boolean {
  if (configuredCache !== undefined) return configuredCache;
  configuredCache = Boolean(getSupabaseUrl() && getSupabaseAnonKey());
  return configuredCache;
}

/** Throw a descriptive error if Supabase is not configured. */
export function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }
}