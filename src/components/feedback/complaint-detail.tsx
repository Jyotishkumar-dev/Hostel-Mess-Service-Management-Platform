import Link from "next/link";
import { ArrowLeft, FileText, History, MapPin, UserRound } from "lucide-react";
import { AREA_LABELS, CATEGORY_LABELS } from "@/config/status";
import { PriorityBadge, StatusBadge } from "@/components/feedback/status-badges";
import { ComplaintTimeline, NEXT_STEP_HINT } from "@/components/feedback/complaint-timeline";
import { DetailList, DetailSection } from "@/components/feedback/detail-panels";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Complaint } from "@/types/complaint";

/**
 * The shared complaint detail view.
 *
 * Student, staff and admin all render the same record; only `backHref`,
 * `backLabel` and the optional `actions` slot differ. Keeping it in one place
 * is what guarantees a complaint looks identical wherever it is opened.
 */
export function ComplaintDetail({
  complaint,
  backHref,
  backLabel,
  actions,
  showStudent = false,
}: {
  complaint: Complaint;
  backHref: string;
  backLabel: string;
  actions?: React.ReactNode;
  showStudent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 border-b pb-5">
        <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
          <Link href={backHref}>
            <ArrowLeft data-icon="inline-start" aria-hidden="true" />
            {backLabel}
          </Link>
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {complaint.reference}
              </span>
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>
            <h1 className="mt-2.5 text-xl font-semibold tracking-tight text-balance">
              {complaint.title}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden="true" />
                {complaint.location}
              </span>
              <span>
                {AREA_LABELS[complaint.area]} ·{" "}
                {CATEGORY_LABELS[complaint.category]}
              </span>
            </p>
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <DetailSection
            icon={FileText}
            title="Reported issue"
            description={`Submitted ${complaint.createdAt}`}
          >
            <p className="text-sm leading-relaxed text-muted-foreground">
              {complaint.description}
            </p>
          </DetailSection>

          {complaint.resolutionNote ? (
            <DetailSection
              icon={FileText}
              title="Resolution note"
              description="Logged by the assigned staff member"
            >
              <p className="text-sm leading-relaxed text-muted-foreground">
                {complaint.resolutionNote}
              </p>
            </DetailSection>
          ) : null}

          <DetailSection
            icon={History}
            title="Progress"
            description="Every status change, in order."
          >
            <ComplaintTimeline complaint={complaint} />
          </DetailSection>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="pt-2">
              <h2 className="text-sm font-medium">Next step</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {NEXT_STEP_HINT[complaint.status]}
              </p>
            </CardContent>
          </Card>

          <DetailSection icon={UserRound} title="Details">
            <DetailList
              items={[
                ...(showStudent
                  ? [
                      {
                        label: "Reported by",
                        value: complaint.studentName,
                      },
                    ]
                  : []),
                {
                  label: "Assigned to",
                  value: complaint.assignedStaff
                    ? `${complaint.assignedStaff.name} · ${complaint.assignedStaff.team}`
                    : "Not yet assigned",
                },
                { label: "Area", value: AREA_LABELS[complaint.area] },
                { label: "Category", value: CATEGORY_LABELS[complaint.category] },
                { label: "Reported on", value: complaint.createdAt },
                { label: "Last update", value: complaint.updatedAt },
              ]}
            />
          </DetailSection>
        </div>
      </div>
    </div>
  );
}
