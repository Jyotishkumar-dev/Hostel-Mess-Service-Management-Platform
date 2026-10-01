import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { optionalUser, roleHome } from "@/lib/auth";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your Campus Resolve account.",
};

export default async function SignupPage() {
  const user = await optionalUser();

  if (user) redirect(roleHome(user.role));

  return <SignupForm />;
}
