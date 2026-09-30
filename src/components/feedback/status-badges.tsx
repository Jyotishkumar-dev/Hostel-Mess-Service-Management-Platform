import { cn } from "@/lib/utils";
import { priorityStyle, statusStyle } from "@/config/status";
import type { ComplaintPriority, ComplaintStatus } from "@/types/complaint";

/**
 * Status and priority indicators.
 *
 * These are the only components allowed to style a status or priority. They
 * read from `src/config/status.ts`, so a change there updates every screen.
 */

export function StatusBadge({
  status,
  className,
}: {
  status: ComplaintStatus;
  className?: string;
}) {
  const style = statusStyle(status);

  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        style.badgeClass,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", style.dotClass)}
      />
      {style.label}
    </span>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: ComplaintPriority;
  className?: string;
}) {
  const style = priorityStyle(priority);

  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full px-2 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        style.badgeClass,
        className,
      )}
    >
      {style.label}
    </span>
  );
}

/**
 * A text label plus a coloured dot. Used where a full badge would be too heavy,
 * for example inside dense tables.
 */
export function StatusDot({ status }: { status: ComplaintStatus }) {
  const style = statusStyle(status);

  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span
        aria-hidden="true"
        className={cn("size-2 shrink-0 rounded-full", style.dotClass)}
      />
      {style.label}
    </span>
  );
}
