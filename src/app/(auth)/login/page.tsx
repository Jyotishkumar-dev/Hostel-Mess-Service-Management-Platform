import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { optionalUser, roleHome } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Campus Resolve account.",
};

export default async function LoginPage() {
  const user = await optionalUser();

  // Already signed in — no reason to show the login form again.
  if (user) redirect(roleHome(user.role));

  return <LoginForm />;
}
