import { cn } from "@/lib/utils";
import { statusStyle } from "@/config/status";
import type { Complaint, ComplaintStatus } from "@/types/complaint";

/**
 * The vertical status history shown on a complaint detail page.
 *
 * The order always matches `STATUS_ORDER`, so a reopened issue shows the full
 * journey including the moment the student rejected the fix.
 */
export function ComplaintTimeline({ complaint }: { complaint: Complaint }) {
  return (
    <ol className="relative space-y-5">
      {complaint.timeline.map((entry, index) => {
        const style = statusStyle(entry.status);
        const isLast = index === complaint.timeline.length - 1;

        return (
          <li key={`${entry.status}-${entry.at}`} className="relative flex gap-3.5">
            {!isLast ? (
              <span
                aria-hidden="true"
                className="absolute top-6 left-[7px] h-[calc(100%+0.25rem)] w-px bg-border"
              />
            ) : null}

            <span
              aria-hidden="true"
              className={cn(
                "relative mt-1 size-[15px] shrink-0 rounded-full ring-4 ring-card",
                style.dotClass,
              )}
            />

            <div className="min-w-0 flex-1 pb-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                <p className="text-sm font-medium">{style.label}</p>
                <p className="text-xs text-muted-foreground">{entry.at}</p>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {entry.note}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {entry.actorName}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** The next step a given status implies, written for the student. */
export const NEXT_STEP_HINT: Record<ComplaintStatus, string> = {
  reported:
    "Your report is in the admin queue. You will see an assignee once it is reviewed.",
  assigned:
    "A staff member has been assigned and will begin work shortly.",
  in_progress: "Work has started. You can follow progress on this page.",
  resolved:
    "Marked complete. Confirm the fix, or reopen it if the problem is still there.",
  reopened:
    "Reopened with your feedback. The same team has been notified to take another look.",
};
