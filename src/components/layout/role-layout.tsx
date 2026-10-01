import { DashboardShell } from "@/components/layout/dashboard-shell";
import type { AuthUser } from "@/types/auth";

/**
 * Thin wrapper so each role folder only needs a five-line layout:
 *
 *   export default async function StudentLayout({ children }: LayoutProps<'/student'>) {
 *     const user = await requireRole("student");
 *     return <RoleLayout user={user}>{children}</RoleLayout>;
 *   }
 *
 * The role comes from the Supabase session. Phase 1 used a static string.
 */
export function RoleLayout({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  return <DashboardShell user={user} role={user.role}>{children}</DashboardShell>;
}