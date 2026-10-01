/**
 * Authentication and user types.
 *
 * These mirror the `profiles` table and Supabase Auth user shape.
 * They are plain TypeScript — no runtime behaviour — so they can be imported
 * from both server and client components.
 */

import type {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  ServiceArea,
} from "@/types/complaint";

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
 * The `public.complaints` row, exactly as it comes back from Postgres.
 *
 * `type` alias rather than `interface` for the same reason as `Profile` — see
 * the note above.
 */
export type ComplaintRow = {
  id: string;
  reference: string;
  user_id: string;
  service_type: ServiceArea;
  category: ComplaintCategory;
  title: string;
  description: string;
  location: string;
  image_path: string | null;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assigned_staff_id: string | null;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
};

/** The `public.complaint_events` row (one per status change). */
export type ComplaintEventRow = {
  id: string;
  complaint_id: string;
  status: ComplaintStatus;
  note: string;
  actor_id: string | null;
  actor_name: string;
  created_at: string;
};

/**
 * Minimal hand-written `Database` type covering the Phase 2 `profiles` table
 * and the Phase 3 `complaints` / `complaint_events` tables.
 *
 * This matches the shape `supabase gen types typescript` produces, so it can be
 * swapped for the generated file without touching any call site. The empty
 * `Views` / `Functions` / `CompositeTypes` entries are required by
 * supabase-js's `GenericSchema` constraint.
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
      complaints: {
        Row: ComplaintRow;
        /**
         * Only these columns are written by the app. `status`, `priority`,
         * `assigned_staff_id` and `resolution_note` are deliberately absent:
         * they are assigned by the database or by privileged later phases, and
         * omitting them means `insert()` will not typecheck if someone tries.
         */
        Insert: Pick<
          ComplaintRow,
          "service_type" | "category" | "title" | "description" | "location"
        > & { image_path?: string | null };
        Update: Partial<
          Pick<
            ComplaintRow,
            | "status"
            | "priority"
            | "assigned_staff_id"
            | "resolution_note"
            | "image_path"
          >
        >;
        Relationships: [
          {
            foreignKeyName: "complaints_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "complaints_assigned_staff_id_fkey";
            columns: ["assigned_staff_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      complaint_events: {
        Row: ComplaintEventRow;
        /** Events are written by triggers and later-phase Server Actions only. */
        Insert: Pick<
          ComplaintEventRow,
          "complaint_id" | "status" | "note" | "actor_id" | "actor_name"
        >;
        Update: Partial<ComplaintEventRow>;
        Relationships: [
          {
            foreignKeyName: "complaint_events_complaint_id_fkey";
            columns: ["complaint_id"];
            isOneToOne: false;
            referencedRelation: "complaints";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "complaint_events_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      /**
       * The only write a student may make after creating a complaint. SECURITY
       * DEFINER and scoped to the caller's own row — see migration 0002.
       */
      attach_complaint_image: {
        Args: { target_complaint_id: string; target_image_path: string };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      service_area: ServiceArea;
      complaint_status: ComplaintStatus;
      complaint_priority: ComplaintPriority;
      complaint_category: ComplaintCategory;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
