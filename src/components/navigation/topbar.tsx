"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Menu, Repeat2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_NAV, MOCK_SESSIONS } from "@/config/navigation";
import type { Role } from "@/types";

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
  role,
  onOpenMobileNav,
}: {
  role: Role;
  onOpenMobileNav: () => void;
}) {
  const section = useCurrentSection(role);
  const user = MOCK_SESSIONS[role];
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
          <RolePreviewSwitcher role={role} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 gap-2 px-1.5 sm:px-2"
                aria-label="Account menu"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {user.initials}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-medium leading-tight">
                    {user.name}
                  </span>
                  <span className="block text-[11px] leading-tight text-muted-foreground">
                    {user.context}
                  </span>
                </span>
                <ChevronDown
                  className="hidden size-3.5 text-muted-foreground sm:block"
                  aria-hidden="true"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <LogOut aria-hidden="true" />
                Sign out
                <span className="ml-auto text-[11px] text-muted-foreground">
                  Phase 2
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

/**
 * Phase 1 stand-in for authentication. Lets a reviewer jump between the three
 * role portals so the whole product can be demonstrated without logging in.
 * Replaced by the real session in Phase 2.
 */
function RolePreviewSwitcher({ role }: { role: Role }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="hidden gap-1.5 sm:inline-flex"
          aria-label="Switch role preview"
        >
          <Repeat2 aria-hidden="true" />
          {ROLE_NAV[role].label}
          <ChevronDown
            className="size-3.5 text-muted-foreground"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal text-muted-foreground">
          Preview a role — sign-in arrives in Phase 2
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(ROLE_NAV) as Role[]).map((option) => (
          <DropdownMenuItem key={option} asChild>
            <Link
              href={ROLE_NAV[option].basePath}
              className={cn(option === role && "bg-accent")}
            >
              {ROLE_NAV[option].label}
              {option === role ? (
                <span className="ml-auto text-[11px] text-muted-foreground">
                  current
                </span>
              ) : null}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
