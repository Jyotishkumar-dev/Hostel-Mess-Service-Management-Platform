"use client";

import { signOutAction } from "@/lib/auth";
import { LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
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
 * User menu dropdown in the topbar.
 *
 * Shows the user's name, email, role, and a sign-out button.
 */
export function UserMenu({ user }: { user: AuthUser }) {
  return (
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
              {user.fullName}
            </span>
            <span className="block text-[11px] leading-tight text-muted-foreground">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
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
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2",
                "focus:bg-accent focus:text-accent-foreground"
              )}
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}