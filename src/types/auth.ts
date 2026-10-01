/**
 * Authentication and user types.
 *
 * These mirror the `profiles` table and Supabase Auth user shape.
 * They are plain TypeScript — no runtime behaviour — so they can be imported
 * from both server and client components.
 */

export const ROLES = ["student", "admin", "staff"] as const;

export type UserRole = (typeof ROLES)[number];

/** Application-level user profile (matches `public.profiles` table). */
export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

/** Minimal user shape used throughout the UI. */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  initials: string;
}

/** Login form values. */
export interface LoginValues {
  email: string;
  password: string;
}

/** Signup form values. */
export interface SignupValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/** Result shape for server actions. */
export interface AuthActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
}

/** Typed database interface for @supabase/ssr generic. */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
    };
    Enums: {
      user_role: UserRole;
    };
  };
}