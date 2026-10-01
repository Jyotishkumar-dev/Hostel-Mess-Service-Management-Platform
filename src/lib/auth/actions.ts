"use server";

import "server-only";

import { redirect } from "next/navigation";
import { createTypedServerClient } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAuthUser, roleHome } from "@/lib/auth/session";
import { mapLoginError, mapSignupError } from "@/lib/auth/errors";
import { loginSchema, signupSchema } from "@/lib/validations";
import type { AuthActionState } from "@/types/auth";

/**
 * Authentication Server Actions.
 *
 * These run on the server only. Each one re-validates with the same Zod schema
 * the form uses on the client, so the rules are defined exactly once.
 *
 * `redirect()` is deliberately called outside any try/catch — Next signals a
 * redirect by throwing, so catching it would swallow the navigation.
 *
 * Note: in a `"use server"` file every export must be an async function.
 */

const NOT_CONFIGURED =
  "Authentication is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.";

/** Flatten a Zod error into `{ fieldName: firstMessage }`. */
function fieldErrorsFrom(error: {
  flatten(): { fieldErrors: Record<string, string[] | undefined> };
}): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [field, messages] of Object.entries(error.flatten().fieldErrors)) {
    if (messages?.[0]) result[field] = messages[0];
  }

  return result;
}

/**
 * Sign in with email and password, then send the user to the dashboard that
 * matches their role in the database.
 */
export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: NOT_CONFIGURED };
  }

  const supabase = await createTypedServerClient();
  if (!supabase) {
    return { status: "error", message: NOT_CONFIGURED };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { status: "error", message: mapLoginError(error) };
  }

  // The redirect target comes from the same trusted lookup the dashboard
  // guards use, so it can never be influenced by the client.
  const user = await getAuthUser();

  if (!user) {
    return {
      status: "error",
      message: "Signed in, but your profile could not be loaded. Please try again.",
    };
  }

  redirect(roleHome(user.role));
}

/**
 * Create a student account.
 *
 * There is deliberately no `role` field here. The profile row is created by a
 * database trigger that hardcodes `role = 'student'`, so nobody can promote
 * themselves no matter what they send to this action.
 */
export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: NOT_CONFIGURED };
  }

  const supabase = await createTypedServerClient();
  if (!supabase) {
    return { status: "error", message: NOT_CONFIGURED };
  }

  const { fullName, email, password } = parsed.data;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Read by the database trigger when it creates the profile row.
      data: { full_name: fullName },
    },
  });

  if (error) {
    return { status: "error", message: mapSignupError(error) };
  }

  // With email confirmation enabled, Supabase returns a user but no session.
  // Tell them to confirm rather than pretending they are signed in.
  if (data.user && !data.session) {
    return {
      status: "success",
      message:
        "Account created. Check your inbox to confirm your email address, then sign in.",
    };
  }

  // Email confirmation is disabled: sign them in and let the login flow place
  // them on the right dashboard.
  redirect("/login");
}

/** Sign out and return to the login screen. */
export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createTypedServerClient();
    await supabase?.auth.signOut();
  }

  redirect("/login");
}
