import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ComplaintDetail } from "@/components/feedback/complaint-detail";
import { findComplaint } from "@/lib/mock";

export async function generateMetadata({
  params,
}: PageProps<"/staff/issues/[id]">): Promise<Metadata> {
  const { id } = await params;
  const complaint = findComplaint(id);

  return { title: complaint ? `${complaint.reference} · Assigned` : "Issue" };
}

export default async function StaffIssuePage({
  params,
}: PageProps<"/staff/issues/[id]">) {
  const { id } = await params;
  const complaint = findComplaint(id);

  if (!complaint) notFound();

  const isResolved = complaint.status === "resolved";

  return (
    <ComplaintDetail
      complaint={complaint}
      backHref="/staff/issues"
      backLabel="Back to assigned issues"
      showStudent
      actions={
        <>
          <Button variant="outline" disabled>
            {isResolved ? "Resolution logged" : "Mark as in progress"}
          </Button>
          <Button disabled>{isResolved ? "Closed" : "Mark as resolved"}</Button>
        </>
      }
    />
  );
}
