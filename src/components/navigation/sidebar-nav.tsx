"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ROLE_NAV } from "@/config/navigation";
import type { Role } from "@/types";

/**
 * The sidebar navigation list.
 *
 * Active state is decided once here, from the current pathname, so every
 * section highlights the same way. A parent route also highlights its child
 * links' parent, e.g. `/student/complaints/new` keeps "My Complaints" active.
 */
export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const nav = ROLE_NAV[role];

  return (
    <nav aria-label={`${nav.label} navigation`} className="flex flex-col gap-0.5">
      {nav.items.map((item) => {
        const isActive =
          item.href === nav.basePath
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive
                ? "neu-raised-sm bg-card font-semibold text-foreground shadow-xs"
                : "text-muted-foreground hover:bg-card/40 hover:text-foreground",
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0 transition-colors",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
              aria-hidden="true"
            />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

/** The same items, expanded with descriptions. Used by the mobile drawer. */
export function SidebarNavDetailed({ role }: { role: Role }) {
  const pathname = usePathname();
  const nav = ROLE_NAV[role];

  return (
    <nav aria-label={`${nav.label} navigation`} className="flex flex-col gap-1">
      {nav.items.map((item) => {
        const isActive =
          item.href === nav.basePath
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-start gap-3.5 rounded-2xl p-3 transition-all duration-200",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive
                ? "neu-raised-sm bg-card text-foreground font-medium shadow-xs"
                : "text-muted-foreground hover:bg-card/40 hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl",
                isActive
                  ? "neu-inset-sm bg-card/60 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  "block truncate text-sm",
                  isActive && "font-medium",
                )}
              >
                {item.title}
              </span>
              {item.description ? (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {item.description}
                </span>
              ) : null}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
