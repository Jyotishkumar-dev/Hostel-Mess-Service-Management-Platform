import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ComplaintDetail } from "@/components/feedback/complaint-detail";
import { findComplaint } from "@/lib/mock";

export async function generateMetadata({
  params,
}: PageProps<"/student/complaints/[id]">): Promise<Metadata> {
  const { id } = await params;
  const complaint = findComplaint(id);

  return { title: complaint ? complaint.reference : "Complaint" };
}

export default async function StudentComplaintPage({
  params,
}: PageProps<"/student/complaints/[id]">) {
  const { id } = await params;
  const complaint = findComplaint(id);

  if (!complaint) notFound();

  return (
    <ComplaintDetail
      complaint={complaint}
      backHref="/student/complaints"
      backLabel="Back to my complaints"
      showStudent
      actions={
        <>
          <Button variant="outline" disabled>
            Reopen if unresolved
          </Button>
          <Button disabled>Confirm the fix</Button>
        </>
      }
    />
  );
}
