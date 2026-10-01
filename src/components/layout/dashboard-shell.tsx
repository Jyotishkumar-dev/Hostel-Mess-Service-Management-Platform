"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_NAV } from "@/config/navigation";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  SidebarNav,
  SidebarNavDetailed,
} from "@/components/navigation/sidebar-nav";
import { Topbar } from "@/components/navigation/topbar";
import type { Role } from "@/types";
import type { AuthUser } from "@/types/auth";

/**
 * The application shell shared by all three role portals.
 *
 * Desktop gets a persistent sidebar; below `lg` the same navigation moves into
 * a side sheet opened from the topbar. Both render the same nav data, so there
 * is only ever one definition of the menu.
 */
export function DashboardShell({
  user,
  role,
  children,
}: {
  user: AuthUser;
  role: Role;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const nav = ROLE_NAV[role];

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-sidebar lg:flex">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <p className="px-2.5 pb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {nav.label}
          </p>
          <SidebarNav role={role} />
        </div>
        <PhaseNote />
      </aside>

      {/* Content column */}
      <div className="lg:pl-64">
        <Topbar
          user={user}
          role={role}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        {/* Mobile navigation sheet */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="flex w-[19rem] max-w-[85vw] flex-col gap-0 p-0">
            <SheetHeader className="flex-row items-center justify-between border-b px-4 py-3.5">
              <div>
                <SheetTitle className="text-sm">
                  <Brand />
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Navigation for the {nav.label} portal
                </SheetDescription>
              </div>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close navigation menu"
                >
                  <X aria-hidden="true" />
                </Button>
              </SheetTrigger>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-3">
              <p className="px-3 pb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {nav.label}
              </p>
              <div onClick={() => setMobileNavOpen(false)}>
                <SidebarNavDetailed role={role} />
              </div>
            </div>
            <PhaseNote />
          </SheetContent>
        </Sheet>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * A quiet, permanent reminder that the current build is a UI shell. It appears
 * in every portal so no screenshot or demo frame can be mistaken for live data.
 */
function PhaseNote({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "border-t border-sidebar-border px-4 py-3.5 text-[11px] leading-relaxed text-muted-foreground",
        className,
      )}
    >
      Phase 1 preview. Records shown are sample data, not live campus issues.
    </p>
  );
}