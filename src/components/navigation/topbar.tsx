"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/user-menu";
import { ROLE_NAV } from "@/config/navigation";
import type { Role } from "@/types";
import type { AuthUser } from "@/types/auth";

/** Finds the nav item that matches the current route, for the topbar title. */
function useCurrentSection(role: Role) {
  const pathname = usePathname();
  const nav = ROLE_NAV[role];

  const match = nav.items.find((item) =>
    item.href === nav.basePath
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return match ?? nav.items[0];
}

export function Topbar({
  user,
  role,
  onOpenMobileNav,
}: {
  user: AuthUser;
  role: Role;
  onOpenMobileNav: () => void;
}) {
  const section = useCurrentSection(role);
  const nav = ROLE_NAV[role];

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-sm">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
        >
          <Menu aria-hidden="true" />
        </Button>

        <div className="lg:hidden">
          <Brand />
        </div>

        <div className="hidden min-w-0 lg:block">
          <p className="text-xs text-muted-foreground">{nav.label} portal</p>
          <p className="truncate text-sm font-medium">{section.title}</p>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}