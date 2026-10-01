import type { ReactNode } from "react";

/**
 * Layout for `/login` and `/signup`.
 *
 * The auth screens render their own centred card via `AuthShell`, so this only
 * needs to group the routes. The "already signed in" redirect lives in the two
 * pages, where `redirect()` can be called cleanly.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
