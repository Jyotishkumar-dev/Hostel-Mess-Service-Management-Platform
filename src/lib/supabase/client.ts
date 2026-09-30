import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 *
 * Uses the public (anon) key, which is safe to ship to the browser — Supabase
 * enforces access control through Row Level Security policies in the database.
 * The service-role key must never be used here or committed anywhere.
 *
 * The call is wrapped in a function rather than a module-level constant so the
 * client is only created the first time a component actually asks for it.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
