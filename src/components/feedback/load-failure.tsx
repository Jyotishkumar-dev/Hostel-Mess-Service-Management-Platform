import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * A database/network failure state shown without the raw error message.
 *
 * Postgres errors can name tables, columns and constraints, which is
 * information a user should not see. The real message is written to the server
 * log; what reaches the browser is a generic, friendly explanation plus a retry
 * link.
 */
export function LoadFailure({
  message,
  retryHref,
}: {
  message: string;
  retryHref: string;
}) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed px-6 py-16">
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive"
      >
        <AlertTriangle className="size-5" />
      </span>
      <div>
        <h2 className="text-base font-semibold">Something went wrong</h2>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
      <Button asChild variant="outline">
        <Link href={retryHref}>Try again</Link>
      </Button>
    </div>
  );
}
