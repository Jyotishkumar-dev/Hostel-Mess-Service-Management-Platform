"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary.
 *
 * `retry` re-fetches the segment and re-renders — preferred over the older
 * `reset`, which only cleared local state.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Replace with your error reporter (Sentry, etc.) when one is added.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </span>
      <div>
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This page failed to load. Try again — if it keeps happening, the
          problem has been logged.
        </p>
      </div>
      <Button onClick={() => retry()}>
        <RotateCcw aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}
