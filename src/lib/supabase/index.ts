/**
 * Supabase entry point.
 *
 * Import from `@/lib/supabase` in application code and choose the client you
 * need:
 *
 *   - `createClient` in a Client Component or browser code
 *   - `createServerClient` in a Server Component, Server Action or Route Handler
 */

export { createClient } from "@/lib/supabase/client";
export { createServerClient } from "@/lib/supabase/server";
