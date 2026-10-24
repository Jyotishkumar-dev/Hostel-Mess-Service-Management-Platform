"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AuthUser } from "@/types/auth";

/**
 * Account menu in the topbar.
 *
 * Sign-out is a real form posting to a Server Action, so it works even before
 * hydration and never depends on client-side state.
 */
export function UserMenu({ user }: { user: AuthUser }) {
  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9.5 gap-2.5 rounded-2xl neu-interactive bg-card px-2.5"
          aria-label="Account menu"
        >
          <span className="flex size-7.5 items-center justify-center rounded-full neu-inset-sm bg-card/70 text-xs font-bold text-primary">
            {user.initials}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block max-w-32 truncate text-xs font-semibold leading-tight text-foreground">
              {user.fullName}
            </span>
            <span className="block text-[10px] uppercase font-bold tracking-wider leading-tight text-primary">
              {roleLabel}
            </span>
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{user.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/" className="justify-start gap-2">
            Campus Resolve home
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <form action={signOutAction} className="w-full">
            <button
              type="submit"
              className="flex w-full cursor-default items-center gap-2 text-sm outline-none select-none"
            >
              <LogOut aria-hidden="true" />
              Sign out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
