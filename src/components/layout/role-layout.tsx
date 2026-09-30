import { DashboardShell } from "@/components/layout/dashboard-shell";
import type { Role } from "@/types";

/**
 * Thin wrapper so each role folder only needs a five-line layout:
 *
 *   export default function StudentLayout({ children }: LayoutProps<'/student'>) {
 *     return <RoleLayout role="student">{children}</RoleLayout>
 *   }
 *
 * The role itself is static for now. Phase 2 replaces it with the role from
 * the Supabase session.
 */
export function RoleLayout({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  return <DashboardShell role={role}>{children}</DashboardShell>;
}
