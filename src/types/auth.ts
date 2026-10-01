/**
 * Authentication and user types.
 *
 * These mirror the `profiles` table and Supabase Auth user shape.
 * They are plain TypeScript — no runtime behaviour — so they can be imported
 * from both server and client components.
 */

export const ROLES = ["student", "admin", "staff"] as const;

export type UserRole = (typeof ROLES)[number];

/**
 * Application-level user profile (matches the `public.profiles` table).
 *
 * Declared as a `type` alias rather than an `interface` on purpose: supabase-js
 * requires every `Row` to satisfy `Record<string, unknown>`, and only type
 * aliases receive an implicit index signature. Using an `interface` here makes
 * every query silently resolve to `never`.
 */
export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

/** Minimal user shape used throughout the UI. */
export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  initials: string;
};

/** Login form values. */
export type LoginValues = {
  email: string;
  password: string;
};

/** Signup form values. */
export type SignupValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

/** Result shape returned by the auth Server Actions. */
export type AuthActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  /** Field name -> message, used to re-attach errors to React Hook Form. */
  fieldErrors?: Record<string, string>;
};

/**
 * Minimal hand-written `Database` type for the Phase 2 `profiles` table.
 *
 * This matches the shape `supabase gen types typescript` produces, so it can be
 * swapped for the generated file without touching any call site. The empty
 * `Views` / `Functions` / `CompositeTypes` entries are required by
 * supabase-js's `GenericSchema` constraint. Phase 3 adds the complaints tables.
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      user_role: UserRole;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
