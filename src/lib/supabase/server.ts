import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseUrl, getSupabaseAnonKey, assertSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Server-side Supabase client for Server Components, Server Actions and Route
 * Handlers.
 *
 * Returns null if Supabase is not configured, allowing the UI to degrade
 * gracefully instead of throwing during static generation or build.
 */
export async function createServerClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key) return null;

  const cookieStore = await cookies();

  return createSupabaseServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Safe to ignore — middleware/proxy refreshes the session.
        }
      },
    },
  });
}

/** Create a typed server client with Database generics. */
import type { Database } from "@/types/auth";

export async function createTypedServerClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key) return null;

  const cookieStore = await cookies();

  return createSupabaseServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component, where cookies are read-only.
        }
      },
    },
  });
}