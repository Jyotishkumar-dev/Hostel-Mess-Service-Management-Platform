import type { ReactNode } from "react";
import { optionalUser, roleHome } from "@/lib/auth";
import type { UserRole } from "@/types/auth";

/**
 * Auth route group layout.
 *
 * If the user is already signed in, redirect them to their role dashboard.
 * This prevents signed-in users from seeing the login/signup pages.
 */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const user = await optionalUser();

  if (user) {
    // Signed in — send them to their dashboard
    return (
      <html lang="en">
        <head>
          <meta httpEquiv="refresh" content={`0;url=${roleHome(user.role)}`} />
        </head>
        <body>Redirecting…</body>
      </html>
    );
  }

  return <>{children}</>;
}