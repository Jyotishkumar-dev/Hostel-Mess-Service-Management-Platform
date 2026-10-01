"use client";

import { createContext, useContext, ReactNode } from "react";
import type { AuthUser } from "@/types/auth";

const UserContext = createContext<AuthUser | null>(null);

export function UserProvider({ user, children }: { user: AuthUser; children: ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

/**
 * Get the current authenticated user from the provider.
 * Must be used within a UserProvider (provided by RoleLayout).
 */
export function useAuthUser(): AuthUser {
  const user = useContext(UserContext);
  if (!user) {
    throw new Error("useAuthUser must be used within a UserProvider");
  }
  return user;
}