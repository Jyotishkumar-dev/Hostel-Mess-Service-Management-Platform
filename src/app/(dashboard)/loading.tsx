import { PageHeaderSkeleton } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dashboard loading state.
 *
 * Mirrors the real page layout so navigating between sections does not shift
 * the content around while data resolves.
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[6.5rem] rounded-xl" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
