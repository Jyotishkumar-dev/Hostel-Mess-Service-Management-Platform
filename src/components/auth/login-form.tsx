"use client";

import { useActionState, useTransition } from "react";
import { useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";
import { signInAction } from "@/lib/auth";
import { loginSchema, loginDefaults, type LoginValues } from "@/lib/validations";

/**
 * Login form using React Hook Form + Zod + Server Action.
 *
 * Validation happens on the client via RHF; the Server Action re-validates
 * using the same schema (defense in depth, no duplication).
 */
export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signInAction, {
    status: "idle",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: loginDefaults,
    mode: "onSubmit",
  });

  const [, startTransition] = useTransition();

  const onSubmit = handleSubmit((values) => {
    const fd = new FormData();
    fd.set("email", values.email);
    fd.set("password", values.password);
    startTransition(() => {
      formAction(fd);
    });
  });

  // Map server-side fieldErrors back to RHF
  if (state.fieldErrors) {
    for (const [field, message] of Object.entries(state.fieldErrors)) {
      if (field in loginDefaults) {
        setError(field as keyof LoginValues, { type: "server", message });
      }
    }
  }

  return (
    <AuthShell
      title="Sign in"
      description="Enter your credentials to access your dashboard."
      footer={
        <p className="text-sm text-center text-muted-foreground">
          Don't have an account?{" "}
          <a href="/signup" className="underline hover:text-foreground">
            Create one
          </a>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {state.status === "error" && (
          <div
            className={cn(
              "rounded-lg border bg-destructive/10 p-3 text-sm text-destructive",
              "animate-in fade-in-0"
            )}
            role="alert"
          >
            {state.message}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              placeholder="you@university.edu"
              className="pl-10"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              disabled={isPending}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground underline">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="pl-10"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              disabled={isPending}
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
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