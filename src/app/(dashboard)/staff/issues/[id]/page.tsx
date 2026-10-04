import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComplaintDetail } from "@/components/feedback/complaint-detail";
import { StaffWorkflowControls } from "@/components/staff/workflow-controls";
import { getStaffComplaint } from "@/lib/complaints/queries";
import { LoadFailure } from "@/components/feedback/load-failure";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getStaffComplaint(id);

  if (!result.ok || !result.data) return { title: "Issue" };
  return { title: `${result.data.reference} · Assigned` };
}

export default async function StaffIssuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getStaffComplaint(id);

  if (!result.ok) {
    return (
      <LoadFailure message={result.error} retryHref={`/staff/issues/${id}`} />
    );
  }

  // `null` covers both "does not exist" and "owned by another team" — the staff
  // member must not learn which of the two is the case.
  if (!result.data) notFound();

  const complaint = result.data;
  const showStart =
    complaint.status === "assigned" || complaint.status === "reopened";
  const showResolve = complaint.status === "in_progress";

  let pageActions: React.ReactNode = null;

  if (showStart || showResolve) {
    pageActions = (
      <StaffWorkflowControls
        complaintId={complaint.id}
        reference={complaint.reference}
        status={complaint.status}
      />
    );
  }

  return (
    <ComplaintDetail
      complaint={complaint}
      backHref="/staff/issues"
      backLabel="Back to assigned issues"
      actions={pageActions}
    />
  );
}
