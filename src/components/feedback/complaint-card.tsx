import Link from "next/link";
import { MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { priorityStyle, AREA_LABELS, CATEGORY_LABELS } from "@/config/status";
import { PriorityBadge, StatusBadge } from "@/components/feedback/status-badges";
import type { Complaint } from "@/types/complaint";

/**
 * A single complaint rendered as a card.
 *
 * Used in mobile lists, on the dashboard "recent" panels, and anywhere a table
 * would be too wide for the space available.
 */
export function ComplaintCard({
  complaint,
  href,
  className,
}: {
  complaint: Complaint;
  href: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative block overflow-hidden rounded-xl bg-card py-4 pr-4 pl-5 ring-1 ring-foreground/10 transition-colors hover:bg-accent/40 focus-visible:ring-ring focus-visible:ring-2",
        className,
      )}
    >
      {/* Priority is readable at a glance without reading the text. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          priorityStyle(complaint.priority).accentClass,
        )}
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">
          {complaint.reference}
        </span>
        <StatusBadge status={complaint.status} />
        <PriorityBadge priority={complaint.priority} />
      </div>

      <p className="mt-2.5 text-sm font-medium text-foreground group-hover:underline">
        {complaint.title}
      </p>

      <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <MapPin className="size-3.5" aria-hidden="true" />
          <dt className="sr-only">Location</dt>
          <dd>{complaint.location}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Service area</dt>
          <dd>
            {AREA_LABELS[complaint.area]} ·{" "}
            {CATEGORY_LABELS[complaint.category]}
          </dd>
        </div>
        {complaint.assignedStaff ? (
          <div className="flex items-center gap-1.5">
            <User className="size-3.5" aria-hidden="true" />
            <dt className="sr-only">Assigned to</dt>
            <dd>{complaint.assignedStaff.name}</dd>
          </div>
        ) : null}
      </dl>

      <p className="mt-3 text-xs text-muted-foreground">
        Updated {complaint.updatedAt}
      </p>
    </Link>
  );
}
