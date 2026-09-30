"use client";

import { ComplaintFilterBar } from "@/components/feedback/complaint-filters";
import { ComplaintList } from "@/components/feedback/complaint-list";
import { useComplaintFilters } from "@/hooks/use-complaint-filters";
import type { Complaint } from "@/types/complaint";

/**
 * Filter bar plus the resulting list, wired together.
 *
 * This is the only stateful piece of a complaint page; the cards and the table
 * underneath stay stateless so they can be reused anywhere.
 */
export function ComplaintsBrowser({
  complaints,
  basePath,
  emptyTitle,
  emptyDescription,
  emptyActionHref,
  emptyActionLabel,
  showStudent = false,
}: {
  complaints: Complaint[];
  basePath: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionHref?: string;
  emptyActionLabel?: string;
  showStudent?: boolean;
}) {
  const { filters, setFilters, visible, isFiltered, reset } =
    useComplaintFilters(complaints);

  if (complaints.length === 0) {
    return (
      <ComplaintList
        complaints={[]}
        basePath={basePath}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        emptyActionHref={emptyActionHref}
        emptyActionLabel={emptyActionLabel}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ComplaintFilterBar
        complaints={complaints}
        filters={filters}
        onChange={setFilters}
        visibleCount={visible.length}
        isFiltered={isFiltered}
        onReset={reset}
      />

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No complaints match the selected filters. Try clearing them.
        </p>
      ) : (
        <ComplaintList
          complaints={visible}
          basePath={basePath}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          emptyActionHref={emptyActionHref}
          emptyActionLabel={emptyActionLabel}
          showStudent={showStudent}
        />
      )}
    </div>
  );
}
