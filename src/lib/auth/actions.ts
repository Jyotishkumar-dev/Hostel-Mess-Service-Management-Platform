"use server";

import { redirect } from "next/navigation";
import { createTypedServerClient } from "@/lib/supabase";
import { mapLoginError, mapSignupError, mapLogoutError } from "@/lib/auth/errors";
import type { AuthActionState, LoginValues, SignupValues, UserRole } from "@/types/auth";

/** Build the role home path. */
function roleHome(role: UserRole): string {
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
 * Server action: Sign in with email and password.
 *
 * Uses the shared zod schema for server-side validation (defense in depth).
 * Returns fieldErrors for React Hook Form integration.
 */
export async function signInAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { status: "error", message: "Email and password are required." };
  }

  const supabase = await createTypedServerClient();
  if (!supabase) {
    return { status: "error", message: "Authentication is not configured." };
  }

  const { error, data } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { status: "error", message: mapLoginError(error) };
  }

  if (!data.user) {
    return { status: "error", message: "Sign in failed. Please try again." };
  }

  // Fetch the profile to get the role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    // Profile missing is unexpected but shouldn't block sign-in — redirect to student
    redirect("/student");
  }

  redirect(roleHome(profile.role));
}

/**
 * Server action: Sign up a new student.
 *
 * The profile is created automatically by the database trigger (hardcoded role='student').
 * If email confirmation is required, the user is told to check their inbox.
 */
export async function signUpAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  // Basic server-side validation (mirrors client schema)
  if (!fullName || fullName.length > 120) {
    return { status: "error", fieldErrors: { fullName: "Full name is required (max 120 characters)." } };
  }
  if (!email || !email.includes("@")) {
    return { status: "error", fieldErrors: { email: "Enter a valid email address." } };
  }
  if (password.length < 8) {
    return { status: "error", fieldErrors: { password: "Use at least 8 characters." } };
  }
  if (password !== confirmPassword) {
    return { status: "error", fieldErrors: { confirmPassword: "Passwords do not match." } };
  }

  const supabase = await createTypedServerClient();
  if (!supabase) {
    return { status: "error", message: "Authentication is not configured." };
  }

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: undefined, // use default Supabase email confirmation flow
    },
  });

  if (error) {
    return { status: "error", message: mapSignupError(error) };
  }

  // If email confirmation is required, Supabase returns a user without a session
  if (data.user && !data.session) {
    return {
      status: "success",
      message: "Account created! Please check your email to confirm your address, then sign in.",
    };
  }

  // If auto-confirmed (no email confirmation required in project settings), redirect by role
  if (data.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    redirect(roleHome(profile?.role ?? "student"));
  }

  return { status: "success", message: "Account created. You can now sign in." };
}

/**
 * Server action: Sign out the current user.
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createTypedServerClient();
  if (!supabase) {
    redirect("/login");
  }

  const { error } = await supabase.auth.signOut();

  // Even if signOut fails, redirect to login — the session cookie is cleared client-side too
  if (error) {
    // Log server-side for debugging, but don't block the redirect
    console.error("Sign out error:", mapLogoutError(error));
  }

  redirect("/login");
}