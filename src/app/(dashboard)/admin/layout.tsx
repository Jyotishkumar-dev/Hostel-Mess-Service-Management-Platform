import { requireRole } from "@/lib/auth";
import { RoleLayout } from "@/components/layout/role-layout";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("admin");
  return <RoleLayout user={user}>{children}</RoleLayout>;
}