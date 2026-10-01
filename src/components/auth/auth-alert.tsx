import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Inline banner for auth success and error messages.
 *
 * Errors use `role="alert"` so a screen reader announces them as soon as they
 * appear; confirmations use `role="status"` so they are polite.
 */
export function AuthAlert({
  tone,
  children,
}: {
  tone: "error" | "info";
  children: React.ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-sm",
        tone === "error"
          ? "border border-destructive/20 bg-destructive/10 text-destructive"
          : "border border-status-assigned/20 bg-status-assigned-bg text-status-assigned-fg",
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
