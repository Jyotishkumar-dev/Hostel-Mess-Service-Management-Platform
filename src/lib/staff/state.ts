/**
 * Result shape returned by the staff Server Actions.
 *
 * Lives outside the `"use server"` module on purpose, matching the pattern in
 * `@/lib/complaints/state`: a `"use server"` file may only export async
 * functions, so exporting the initial-state constant alongside the actions
 * would drag the server import chain into the client bundle.
 */
export type StaffActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Returned on success so the form can show a confirmation without re-fetching. */
  complaint?: {
    id: string;
    reference: string;
    resolvedAt: string | null;
  };
};

export const INITIAL_STAFF_STATE: StaffActionState = { status: "idle" };
