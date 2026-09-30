import type { ReactNode } from "react";
import { RoleLayout } from "@/components/layout/role-layout";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <RoleLayout role="admin">{children}</RoleLayout>;
}
