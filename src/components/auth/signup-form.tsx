"use client";

import { useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";
import { signUpAction } from "@/lib/auth";
import { signupSchema, signupDefaults, type SignupValues } from "@/lib/validations";

/**
 * Signup form using React Hook Form + Zod + Server Action.
 *
 * The Server Action validates with the same schema.
 * On success, the user is either redirected (if auto-confirmed) or
 * shown a "check your email" message.
 */
export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signUpAction, {
    status: "idle",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: signupDefaults,
    mode: "onSubmit",
  });

  const [, startTransition] = useTransition();

  const onSubmit = handleSubmit((values) => {
    const fd = new FormData();
    fd.set("fullName", values.fullName);
    fd.set("email", values.email);
    fd.set("password", values.password);
    fd.set("confirmPassword", values.confirmPassword);
    startTransition(() => {
      formAction(fd);
    });
  });

  // Map server-side fieldErrors back to RHF
  if (state.fieldErrors) {
    for (const [field, message] of Object.entries(state.fieldErrors)) {
      if (field in signupDefaults) {
        setError(field as keyof SignupValues, { type: "server", message });
      }
    }
  }

  return (
    <AuthShell
      title="Create account"
      description="Sign up to report issues and track their resolution."
      footer={
        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <a href="/login" className="underline hover:text-foreground">
            Sign in
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

        {state.status === "success" && !isPending && (
          <div
            className={cn(
              "rounded-lg border bg-status-resolved-bg/20 p-3 text-sm text-status-resolved-fg",
              "animate-in fade-in-0"
            )}
            role="status"
          >
            {state.message}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="fullName"
              type="text"
              placeholder="Aarav Sharma"
              className="pl-10"
              autoComplete="name"
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
              disabled={isPending}
              {...register("fullName")}
            />
          </div>
          {errors.fullName && (
            <p id="fullName-error" className="text-sm text-destructive" role="alert">
              {errors.fullName.message}
            </p>
          )}
        </div>

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
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="pl-10"
              autoComplete="new-password"
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              className="pl-10"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              disabled={isPending}
              {...register("confirmPassword")}
            />
          </div>
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="text-sm text-destructive" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          By creating an account you agree to our{" "}
          <a href="#" className="underline hover:text-foreground">Terms of Service</a>
          {" and "}
          <a href="#" className="underline hover:text-foreground">Privacy Policy</a>
          .
        </p>
      </form>
    </AuthShell>
  );
}