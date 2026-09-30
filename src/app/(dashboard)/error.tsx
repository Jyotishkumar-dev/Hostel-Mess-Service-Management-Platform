"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Error boundary for a single role portal.
 *
 * Sits inside the dashboard shell, so a failure on one screen keeps the
 * sidebar and topbar in place instead of replacing the whole page.
 */
export default function DashboardError({
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
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center">
      <span className="flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-medium">This section failed to load</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          The rest of the dashboard still works. Retry to reload just this
          section.
        </p>
      </div>
      <Button onClick={() => retry()} variant="outline">
        <RotateCcw aria-hidden="true" />
        Retry
      </Button>
    </div>
  );
}
