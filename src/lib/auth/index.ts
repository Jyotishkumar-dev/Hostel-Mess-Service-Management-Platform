/**
 * Auth library entry point.
 *
 * Server-side utilities:
 *   - getAuthUser: fetch the current user with profile
 *   - requireUser: redirect to /login if not authenticated
 *   - requireRole: redirect to role home if wrong role
 *   - optionalUser: get user or null (no redirect)
 *   - roleHome: get the dashboard path for a role
 *
 * Server Actions:
 *   - signInAction
 *   - signUpAction
 *   - signOutAction
 *
 * Error mapping:
 *   - mapAuthError, mapLoginError, mapSignupError, mapLogoutError
 */
export * from "@/lib/auth/session";
export * from "@/lib/auth/actions";
export * from "@/lib/auth/errors";