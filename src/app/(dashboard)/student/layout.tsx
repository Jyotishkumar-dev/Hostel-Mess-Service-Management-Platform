import { requireRole } from "@/lib/auth";
import { RoleLayout } from "@/components/layout/role-layout";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("student");
  return <RoleLayout user={user}>{children}</RoleLayout>;
}