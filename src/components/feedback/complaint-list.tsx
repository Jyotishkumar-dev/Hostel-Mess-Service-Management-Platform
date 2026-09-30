import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { ComplaintCard } from "@/components/feedback/complaint-card";
import { ComplaintTable } from "@/components/feedback/complaint-table";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import type { Complaint } from "@/types/complaint";

/**
 * Renders complaints as a table on large screens and as cards on small ones.
 *
 * Both layouts read the same data, so a filter or a sort only has to be applied
 * once. `basePath` decides the links, which keeps this reusable across the
 * student, admin and staff sections.
 */
export function ComplaintList({
  complaints,
  basePath,
  emptyTitle,
  emptyDescription,
  emptyActionHref,
  emptyActionLabel,
  showStudent = false,
}: {
  complaints: Complaint[];
  /** Route prefix that complaint links are built from, e.g. "/admin/issues". */
  basePath: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionHref?: string;
  emptyActionLabel?: string;
  showStudent?: boolean;
}) {
  if (complaints.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title={emptyTitle}
        description={emptyDescription}
        action={
          emptyActionHref && emptyActionLabel ? (
            <Button asChild size="lg">
              <Link href={emptyActionHref}>{emptyActionLabel}</Link>
            </Button>
          ) : null
        }
      />
    );
  }

  return (
    <>
      {/* Mobile and tablet: cards. */}
      <ul className="grid gap-3 md:hidden">
        {complaints.map((complaint) => (
          <li key={complaint.id}>
            <ComplaintCard
              complaint={complaint}
              href={`${basePath}/${complaint.id}`}
            />
          </li>
        ))}
      </ul>

      {/* Desktop: a scannable table. */}
      <div className="hidden md:block">
        <ComplaintTable
          complaints={complaints}
          caption="Reported issues"
          showStudent={showStudent}
        />
      </div>
    </>
  );
}
