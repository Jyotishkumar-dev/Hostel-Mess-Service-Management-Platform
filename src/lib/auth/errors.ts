/**
 * Friendly error messages for Supabase Auth errors.
 *
 * Never expose raw Supabase error strings to users — they may leak
 * implementation details or be confusing. Map known error codes/messages
 * to clear, actionable text.
 */

interface ErrorMapEntry {
  /** Match against the error message (case-insensitive substring). */
  match: string;
  /** Friendly message to show instead. */
  message: string;
}

/** Ordered list: first match wins. */
const ERROR_MAP: ErrorMapEntry[] = [
  // Login errors
  { match: "invalid login credentials", message: "Email or password is incorrect." },
  { match: "invalid credentials", message: "Email or password is incorrect." },
  { match: "email not confirmed", message: "Please confirm your email address before signing in." },
  { match: "user not found", message: "No account exists with that email address." },

  // Signup errors
  { match: "user already registered", message: "An account with this email already exists. Try signing in." },
  { match: "email already exists", message: "An account with this email already exists. Try signing in." },
  { match: "weak password", message: "Please choose a stronger password (at least 8 characters)." },
  { match: "password should be at least", message: "Please choose a stronger password (at least 8 characters)." },

  // Rate limiting
  { match: "too many requests", message: "Too many attempts. Please wait a minute and try again." },
  { match: "rate limit", message: "Too many attempts. Please wait a minute and try again." },

  // Network / unexpected
  { match: "network", message: "We couldn't reach the server. Check your connection and try again." },
  { match: "fetch failed", message: "We couldn't reach the server. Check your connection and try again." },
  { match: "timeout", message: "The request timed out. Please try again." },

  // Database / RLS
  { match: "row-level security", message: "You don't have permission to perform this action." },
  { match: "permission denied", message: "You don't have permission to perform this action." },
];

/** Default fallback for any unmapped error. */
const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

/**
 * Convert a Supabase error into a user-friendly message.
 *
 * Accepts either an Error object or the raw error message string.
 */
export function mapAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const lower = message.toLowerCase();

  for (const entry of ERROR_MAP) {
    if (lower.includes(entry.match.toLowerCase())) {
      return entry.message;
    }
  }

  return DEFAULT_MESSAGE;
}

/** Specialised mapper for login actions. */
export function mapLoginError(error: unknown): string {
  return mapAuthError(error);
}

/** Specialised mapper for signup actions. */
export function mapSignupError(error: unknown): string {
  return mapAuthError(error);
}

/** Specialised mapper for logout (rarely fails, but handle it). */
export function mapLogoutError(error: unknown): string {
  return mapAuthError(error) || "Could not sign out. Please try again.";
}