import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PriorityBadge, StatusBadge } from "@/components/feedback/status-badges";
import { AREA_LABELS, CATEGORY_LABELS } from "@/config/status";
import type { Complaint } from "@/types/complaint";

/**
 * Columns shown on a complaint register.
 *
 * `basePath` decides where the title links to, so the same table serves the
 * student list (`/student/complaints`), the admin register (`/admin/issues`)
 * and the staff worklist (`/staff/issues`) without duplicating the markup.
 */
export function ComplaintTable({
  complaints,
  caption,
  basePath,
  showStudent = false,
}: {
  complaints: Complaint[];
  caption: string;
  /** Route prefix links are built from, e.g. "/student/complaints". */
  basePath: string;
  showStudent?: boolean;
}) {
  return (
    <div className="scrollbar-subtle overflow-x-auto">
      <Table>
        <caption className="sr-only">{caption}</caption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[7rem]">Reference</TableHead>
            <TableHead>Issue</TableHead>
            {showStudent ? <TableHead>Reported by</TableHead> : null}
            <TableHead className="w-[8.5rem]">Status</TableHead>
            <TableHead className="w-[7rem]">Priority</TableHead>
            <TableHead className="w-[10rem]">Assigned to</TableHead>
            <TableHead className="w-[8rem] text-right">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {complaints.map((complaint) => (
            <TableRow key={complaint.id}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {complaint.reference}
              </TableCell>
              <TableCell className="max-w-[22rem]">
                <Link
                  href={`${basePath}/${complaint.id}`}
                  className="block truncate font-medium hover:underline"
                >
                  {complaint.title}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {AREA_LABELS[complaint.area]} ·{" "}
                  {CATEGORY_LABELS[complaint.category]} · {complaint.location}
                </span>
              </TableCell>
              {showStudent ? (
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {complaint.studentName}
                </TableCell>
              ) : null}
              <TableCell>
                <StatusBadge status={complaint.status} />
              </TableCell>
              <TableCell>
                <PriorityBadge priority={complaint.priority} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {complaint.assignedStaff ? (
                  <span className="whitespace-nowrap">
                    {complaint.assignedStaff.name}
                  </span>
                ) : (
                  <span className="text-xs">Unassigned</span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right text-xs text-muted-foreground">
                {complaint.updatedAt}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ComplaintTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 px-4 py-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-14" />
        </div>
      ))}
    </div>
  );
}

/** Lightweight label used above tables, e.g. the active filter summary. */
export function TableCaption({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      {children}
    </p>
  );
}
