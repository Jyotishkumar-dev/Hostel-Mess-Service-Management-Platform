import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your Campus Resolve account.",
};

export default function SignupPage() {
  return <SignupForm />;
}