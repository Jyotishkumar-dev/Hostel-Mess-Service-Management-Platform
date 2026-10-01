import "server-only";

/**
 * Server-side entry point for the complaint feature.
 *
 * Marked server-only because it re-exports the Supabase-backed queries and the
 * create action. Client components must import `INITIAL_COMPLAINT_STATE` from
 * `@/lib/complaints/state` directly, which is deliberately free of any server
 * imports so it can cross the client boundary.
 */
export * from "@/lib/complaints/constants";
export * from "@/lib/complaints/mapper";
export * from "@/lib/complaints/queries";
export * from "@/lib/complaints/actions";
export type { ComplaintActionState } from "@/lib/complaints/state";