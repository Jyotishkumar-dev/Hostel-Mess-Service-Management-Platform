import type { LucideIcon } from "lucide-react";
import type { ServiceArea } from "@/types/complaint";

/** The three roles the product is designed around. */
export const ROLES = ["student", "admin", "staff"] as const;

export type Role = (typeof ROLES)[number];

/** Placeholder identity shown in the top bar during Phase 1. */
export interface SessionUser {
  name: string;
  email: string;
  role: Role;
  initials: string;
  /** Short context line, e.g. "Block C · Hostel Operations". */
  context: string;
}

/** A single entry in the sidebar for a role. */
export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Short description used by the mobile drawer. */
  description?: string;
}

export interface RoleNav {
  role: Role;
  /** Path prefix that marks this section in the route tree. */
  basePath: string;
  label: string;
  items: NavItem[];
}

export interface ChartDatum {
  label: string;
  value: number;
  area?: ServiceArea;
}
