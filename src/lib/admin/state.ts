import "server-only";

/**
 * Result shape returned by the admin Server Actions. Kept outside the
 * `"use server"` module so it can be imported by client components.
 */
export type AdminActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const INITIAL_ADMIN_STATE: AdminActionState = { status: "idle" };
