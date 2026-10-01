import { requireRole } from "@/lib/auth";
import { RoleLayout } from "@/components/layout/role-layout";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("staff");
  return <RoleLayout user={user}>{children}</RoleLayout>;
}