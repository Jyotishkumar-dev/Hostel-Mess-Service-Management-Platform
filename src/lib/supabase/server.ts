import "server-only";

import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/auth";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/env";

/**
 * Server-side Supabase client for Server Components, Server Actions and Route
 * Handlers.
 *
 * Returns null when Supabase has not been configured, so the UI can degrade
 * gracefully instead of crashing during the production build.
 *
 * `cookies()` is awaited *before* the configuration check on purpose. Awaiting
 * a dynamic API is what marks a route as server-rendered at build time, so a
 * page that calls this can never be accidentally prerendered as static HTML
 * with a stale auth result baked in — even on a build machine where
 * NEXT_PUBLIC_* happens to be missing.
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key) return null;

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
          // Safe to ignore — the proxy refreshes the session instead.
        }
      },
    },
  });
}

/**
 * The same client, typed against the `profiles` table.
 *
 * Import this one from Server Components and Server Actions so Supabase queries
 * come back fully typed instead of `any`.
 */
export async function createTypedServerClient() {
  const cookieStore = await cookies();

  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key) return null;

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
          // Read-only in a Server Component.
        }
      },
    },
  });
}