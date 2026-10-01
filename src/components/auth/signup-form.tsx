"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, Lock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthAlert } from "@/components/auth/auth-alert";
import { signUpAction } from "@/lib/auth/actions";
import {
  signupSchema,
  signupDefaults,
  type SignupValues,
} from "@/lib/validations";
import type { AuthActionState } from "@/types/auth";

const INITIAL_STATE: AuthActionState = { status: "idle" };

/**
 * Signup form.
 *
 * There is no role selector here on purpose: every public signup creates a
 * student. Admin and staff roles are granted through controlled database
 * operations, so the form cannot be used to escalate privileges.
 */
export function SignupForm() {
  const [state, formAction, isPending] = useActionState(
    signUpAction,
    INITIAL_STATE,
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: signupDefaults,
  });

  const [, startTransition] = useTransition();

  useEffect(() => {
    for (const [field, message] of Object.entries(state.fieldErrors ?? {})) {
      setError(field as keyof SignupValues, { type: "server", message });
    }
  }, [state, setError]);

  const onSubmit = handleSubmit((values) => {
    const payload = new FormData();
    payload.set("fullName", values.fullName);
    payload.set("email", values.email);
    payload.set("password", values.password);
    payload.set("confirmPassword", values.confirmPassword);

    startTransition(() => formAction(payload));
  });

  return (
    <AuthShell
      title="Create your account"
      description="Report hostel and mess issues and follow them through to a fix."
      footer={
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium underline hover:text-foreground">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {state.status === "error" && state.message ? (
          <AuthAlert tone="error">{state.message}</AuthAlert>
        ) : null}

        {state.status === "success" && state.message ? (
          <AuthAlert tone="info">{state.message}</AuthAlert>
        ) : null}

        <div className="flex flex-col gap-2">
          <Label htmlFor="fullName">Full name</Label>
          <div className="relative">
            <User
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="Aarav Sharma"
              className="pl-10"
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
              disabled={isPending}
              {...register("fullName")}
            />
          </div>
          {errors.fullName ? (
            <p id="fullName-error" className="text-sm text-destructive">
              {errors.fullName.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@university.edu"
              className="pl-10"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              disabled={isPending}
              {...register("email")}
            />
          </div>
          {errors.email ? (
            <p id="email-error" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="pl-10"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              disabled={isPending}
              {...register("password")}
            />
          </div>
          {errors.password ? (
            <p id="password-error" className="text-sm text-destructive">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              className="pl-10"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword ? "confirmPassword-error" : undefined
              }
              disabled={isPending}
              {...register("confirmPassword")}
            />
          </div>
          {errors.confirmPassword ? (
            <p id="confirmPassword-error" className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground">
          New accounts are created with the student role. Staff and admin access
          is granted by the campus services team.
        </p>

        <Button type="submit" size="lg" disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
