import {
  ChartNoAxesColumn,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  MessageSquarePlus,
  Users,
} from "lucide-react";
import type { Role, RoleNav, SessionUser } from "@/types";

/**
 * Static role configuration for Phase 1.
 *
 * Authentication does not exist yet, so each dashboard layout picks its role
 * from this file. When Supabase Auth lands, `sessionUser` will come from the
 * signed-in profile and the layout will read the role from the session instead.
 */

export const ROLE_NAV: Record<Role, RoleNav> = {
  student: {
    role: "student",
    basePath: "/student",
    label: "Student",
    items: [
      {
        title: "Dashboard",
        href: "/student",
        icon: LayoutDashboard,
        description: "Overview of your feedback",
      },
      {
        title: "My Complaints",
        href: "/student/complaints",
        icon: ClipboardList,
        description: "Track everything you have reported",
      },
      {
        title: "Submit Feedback",
        href: "/student/complaints/new",
        icon: MessageSquarePlus,
        description: "Report a hostel or mess issue",
      },
    ],
  },
  admin: {
    role: "admin",
    basePath: "/admin",
    label: "Admin",
    items: [
      {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        description: "Campus-wide service health",
      },
      {
        title: "Issues",
        href: "/admin/issues",
        icon: ListChecks,
        description: "Triage and prioritise incoming issues",
      },
      {
        title: "Analytics",
        href: "/admin/analytics",
        icon: ChartNoAxesColumn,
        description: "Where campus services are improving",
      },
      {
        title: "Staff",
        href: "/admin/staff",
        icon: Users,
        description: "Support teams and workload",
      },
    ],
  },
  staff: {
    role: "staff",
    basePath: "/staff",
    label: "Staff",
    items: [
      {
        title: "Dashboard",
        href: "/staff",
        icon: LayoutDashboard,
        description: "Your assigned work today",
      },
      {
        title: "Assigned Issues",
        href: "/staff/issues",
        icon: ListChecks,
        description: "Everything on your plate",
      },
    ],
  },
};

/** Placeholder identities, used until Supabase Auth is wired up. */
export const MOCK_SESSIONS: Record<Role, SessionUser> = {
  student: {
    name: "Aarav Sharma",
    email: "aarav.sharma@student.lpu.in",
    role: "student",
    initials: "AS",
    context: "B.Tech · Semester 5",
  },
  admin: {
    name: "Meera Iyer",
    email: "meera.iyer@lpu.in",
    role: "admin",
    initials: "MI",
    context: "Campus Services · Administrator",
  },
  staff: {
    name: "Rakesh Yadav",
    email: "rakesh.yadav@lpu.in",
    role: "staff",
    initials: "RY",
    context: "Maintenance · Hostel Operations",
  },
};

/**
 * Works out which role a pathname belongs to. Used by the landing page links
 * and by the shell to highlight the active section.
 */
export function roleFromPath(pathname: string): Role | null {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/staff")) return "staff";
  if (pathname.startsWith("/student")) return "student";
  return null;
}
