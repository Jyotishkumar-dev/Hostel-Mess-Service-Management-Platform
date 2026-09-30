/**
 * Central access point for the Phase 1 mock data layer.
 *
 * Pages and components should import from `@/lib/mock` (or the specific file)
 * rather than declaring sample data inline. In Phase 2 the same call sites will
 * be swapped for Supabase queries, and the rest of the UI will not need to change.
 */
export * from "@/lib/mock/analytics";
export * from "@/lib/mock/complaints";
export * from "@/lib/mock/staff";
export * from "@/lib/mock/statistics";
