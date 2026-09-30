import type { ReactNode } from "react";
import { RoleLayout } from "@/components/layout/role-layout";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return <RoleLayout role="staff">{children}</RoleLayout>;
}
