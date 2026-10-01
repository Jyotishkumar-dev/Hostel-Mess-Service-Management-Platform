import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading state for a single complaint.
 *
 * Shaped like ComplaintDetail: a title block, then the two-column body, so the
 * page does not jump when the record and its timeline arrive.
 */
export default function ComplaintDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 border-b pb-5">
        <Skeleton className="h-8 w-44" />
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-7 w-3/4 max-w-md" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
}