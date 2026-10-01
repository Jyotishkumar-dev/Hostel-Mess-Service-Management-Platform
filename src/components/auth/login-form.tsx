"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthAlert } from "@/components/auth/auth-alert";
import { signInAction } from "@/lib/auth/actions";
import { loginSchema, loginDefaults, type LoginValues } from "@/lib/validations";
import type { AuthActionState } from "@/types/auth";

const INITIAL_STATE: AuthActionState = { status: "idle" };

/**
 * Login form.
 *
 * React Hook Form owns field validation and input state; the Server Action
 * owns authentication. The action returns field-level errors, which are pushed
 * back into React Hook Form so both layers stay in agreement.
 */
export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    signInAction,
    INITIAL_STATE,
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: loginDefaults,
  });

  const [, startTransition] = useTransition();

  // Server-side validation runs last, so its errors land after render.
  useEffect(() => {
    for (const [field, message] of Object.entries(state.fieldErrors ?? {})) {
      setError(field as keyof LoginValues, { type: "server", message });
    }
  }, [state, setError]);

  const onSubmit = handleSubmit((values) => {
    const payload = new FormData();
    payload.set("email", values.email);
    payload.set("password", values.password);

    startTransition(() => formAction(payload));
  });

  return (
    <AuthShell
      title="Sign in"
      description="Enter your credentials to open your dashboard."
      footer={
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium underline hover:text-foreground">
            Create one
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {state.status === "error" && state.message ? (
          <AuthAlert tone="error">{state.message}</AuthAlert>
        ) : null}

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
              autoComplete="current-password"
              placeholder="••••••••"
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

        <Button type="submit" size="lg" disabled={isPending} className="mt-1 w-full">
          {isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
