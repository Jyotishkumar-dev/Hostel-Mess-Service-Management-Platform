/**
 * Server-side session utilities.
 *
 * These functions run in Server Components, Server Actions, and Route Handlers.
 * They use the typed Supabase server client and the profiles table.
 */

import { redirect } from "next/navigation";
import { createTypedServerClient } from "@/lib/supabase";
import type { AuthUser, UserRole, Profile } from "@/types/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Get the authenticated user with their profile (role, name, etc.).
 * Returns null if not authenticated or Supabase not configured.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createTypedServerClient();
  if (!supabase) return null;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  // Fetch profile for role and full_name
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role, email")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    // Profile missing — fall back to auth metadata, default role student
    const fullName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User";
    const email = user.email ?? "";
    return {
      id: user.id,
      email,
      fullName,
      role: "student",
      initials: initialsFrom(fullName),
    };
  }

  return {
    id: user.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    initials: initialsFrom(profile.full_name),
  };
}

/** Build initials from a full name. */
function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Require an authenticated user. Redirects to /login if not signed in.
 */
export async function requireUser(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Require a specific role. Redirects to the user's home if role mismatches.
 * If not authenticated, redirects to /login.
 */
export async function requireRole(expected: UserRole): Promise<AuthUser> {
  const user = await requireUser();
  if (user.role !== expected) {
    // Redirect to their actual role home
    redirect(roleHome(user.role));
  }
  return user;
}

/**
 * Build the home path for a role.
 */
export function roleHome(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "staff":
      return "/staff";
    case "student":
    default:
      return "/student";
  }
}

/**
 * Get the current user if authenticated (no redirect).
 * Useful for pages that show different content based on auth state.
 */
export async function optionalUser(): Promise<AuthUser | null> {
  return getAuthUser();
}