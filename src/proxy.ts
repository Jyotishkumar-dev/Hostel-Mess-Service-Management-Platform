import { NextResponse, type NextRequest } from "next/server";
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { getSupabaseUrl, getSupabaseAnonKey, isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Next.js 16+ Proxy (formerly middleware).
 *
 * Runs before every request to refresh the Supabase session cookies.
 * This prevents the access token from expiring unexpectedly when the user
 * navigates or refreshes the page.
 *
 * IMPORTANT: The proxy runs in a restricted context (Node runtime, no shared
 * modules/globals). It must not import application code that has side effects.
 * It only uses the tiny `isSupabaseConfigured` helper and @supabase/ssr.
 */

export async function proxy(request: NextRequest) {
  // If Supabase is not configured, pass through without touching cookies
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  const response = NextResponse.next({ request });

  const supabase = createSupabaseServerClient(
    getSupabaseUrl()!,
    getSupabaseAnonKey()!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // This call refreshes the access token if the refresh token is valid
  // and writes the new cookies to the response.
  await supabase.auth.getUser();

  return response;
}

/**
 * Matcher config: run on all routes EXCEPT static assets and API routes.
 *
 * The negative lookahead excludes:
 * - /api/*
 * - /_next/static/*
 * - /_next/image/*
 * - favicon.ico
 * - any file with an extension (e.g. .png, .svg, .css)
 */
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};