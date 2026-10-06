/**
 * Result shape returned by the student Server Actions.
 *
 * Lives outside the `"use server"` module on purpose, matching the pattern in
 * `@/lib/complaints/state`: a `"use server"` file may only export async
 * functions, so exporting the initial-state constant alongside the actions
 * would drag the server import chain into the client bundle.
 */
export type StudentActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const INITIAL_STUDENT_ACTION_STATE: StudentActionState = { status: "idle" };
