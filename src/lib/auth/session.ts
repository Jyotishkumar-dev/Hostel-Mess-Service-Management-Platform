import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createTypedServerClient } from "@/lib/supabase";
import type { AuthUser, UserRole } from "@/types/auth";

/**
 * Build the dashboard home path for a role.
 *
 * The role always comes from the database — never from a URL parameter,
 * query string or client-side state.
 */
export function roleHome(role: UserRole): string {
  return `/${role}`;
}

/** First letters of the first and last name, e.g. "Aarav Sharma" -> "AS". */
function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * The authenticated user, with their application profile.
 *
 * Wrapped in React's `cache` so a layout and the page inside it share a single
 * database round trip during the same request.
 *
 * Returns `null` when nobody is signed in, or when Supabase has not been
 * configured yet.
 */
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  // Note: no `isSupabaseConfigured()` short-circuit here on purpose. The client
  // factory awaits `cookies()` before it checks configuration, so calling it
  // unconditionally marks this route as dynamic at build time. An early return
  // would let Next prerender these pages with a baked-in auth result.
  const supabase = await createTypedServerClient();

  // Returns null when NEXT_PUBLIC_SUPABASE_* is not set yet.
  if (!supabase) return null;

  // getUser() revalidates the token against Supabase Auth on the server.
  // It never trusts anything the browser sends.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  // Fall back to Auth metadata if the profile row is missing. This keeps the
  // app usable while the signup trigger is still being applied, and defaults
  // the role to the least-privileged value.
  const fullName =
    profile?.full_name ?? user.user_metadata?.full_name ?? "Campus user";

  return {
    id: user.id,
    email: profile?.email ?? user.email ?? "",
    fullName,
    role: profile?.role ?? "student",
    initials: initialsFrom(fullName),
  };
});

/** Require any signed-in user. Redirects to /login otherwise. */
export async function requireUser(): Promise<AuthUser> {
  const user = await getAuthUser();

  if (!user) redirect("/login");

  return user;
}

/**
 * Require a specific role.
 *
 * This is the server-side security boundary for the dashboards: the check runs
 * in the role layout before any page renders, so it cannot be bypassed by
 * hiding a link or editing client state.
 */
export async function requireRole(role: UserRole): Promise<AuthUser> {
  const user = await requireUser();

  if (user.role !== role) redirect(roleHome(user.role));

  return user;
}

/** Get the current user without redirecting. */
export async function optionalUser(): Promise<AuthUser | null> {
  return getAuthUser();
}
