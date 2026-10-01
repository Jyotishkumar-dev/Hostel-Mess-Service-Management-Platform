/**
 * Supabase entry point.
 *
 * Import from `@/lib/supabase` in application code and choose the client you
 * need:
 *
 *   - `createClient` in a Client Component or browser code
 *   - `createServerClient` in a Server Component, Server Action or Route Handler
 *   - `createTypedServerClient` when you need typed database access
 */
export { createClient, canUseSupabase, requireSupabaseClient } from "@/lib/supabase/client";
export { createServerClient, createTypedServerClient } from "@/lib/supabase/server";
export { getSupabaseUrl, getSupabaseAnonKey, isSupabaseConfigured, assertSupabaseConfigured } from "@/lib/supabase/env";