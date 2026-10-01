/**
 * Result shape returned by `createComplaintAction`.
 *
 * This lives outside the `"use server"` module on purpose: a "use server" file
 * may only export async functions, so exporting the initial-state constant
 * alongside the action would stop Next treating it as a server-action proxy and
 * drag the whole server import chain into the client bundle.
 */
export type ComplaintActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Set on success so the form can show a confirmation. */
  complaint?: {
    id: string;
    reference: string;
    status: string;
    createdAt: string;
  };
};

export const INITIAL_COMPLAINT_STATE: ComplaintActionState = { status: "idle" };