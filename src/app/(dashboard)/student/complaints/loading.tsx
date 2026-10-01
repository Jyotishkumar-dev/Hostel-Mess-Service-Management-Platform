import { PageHeaderSkeleton } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading state for the complaints list.
 *
 * Mirrors the real page — header, filter bar, then rows — so switching between
 * complaints sections does not shift the layout while the query runs.
 */
export default function ComplaintsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />

      {/* Filter bar */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-28 shrink-0 rounded-lg" />
          ))}
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}