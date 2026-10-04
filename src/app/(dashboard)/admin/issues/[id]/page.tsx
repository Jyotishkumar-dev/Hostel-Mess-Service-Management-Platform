import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComplaintDetail } from "@/components/feedback/complaint-detail";
import { AssignStaffForm } from "@/components/admin/assign-staff-form";
import { getAdminComplaint, listStaffProfiles } from "@/lib/admin/queries";
import { LoadFailure } from "@/components/feedback/load-failure";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getAdminComplaint(id);

  if (!result.ok || !result.data) return { title: "Issue" };
  return { title: `${result.data.reference} · Issue` };
}

/**
 * The admin view of a single issue.
 *
 * Shows the full complaint detail — which reflects the live Supabase status,
 * including any staff transitions — and, where the issue is not yet resolved,
 * a form to route it to a support staff member. Assignment is recorded through
 * the `assign_complaint` SECURITY DEFINER function, so the dropdown is the only
 * thing the UI changes: the row it writes is the same one staff read.
 */
export default async function AdminIssuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const complaintResult = await getAdminComplaint(id);
  const staffResult = await listStaffProfiles();

  if (!complaintResult.ok) {
    return <LoadFailure message={complaintResult.error} retryHref="/admin/issues" />;
  }

  if (!complaintResult.data) notFound();

  const complaint = complaintResult.data;
  const staffOptions = staffResult.ok ? staffResult.data : [];

  const canAssign = complaint.status !== "resolved";

  let actions: React.ReactNode = null;
  if (canAssign) {
    actions = (
      <AssignStaffForm complaintId={complaint.id} staffOptions={staffOptions} />
    );
  }

  return (
    <ComplaintDetail
      complaint={complaint}
      backHref="/admin/issues"
      backLabel="Back to issue register"
      showStudent
      actions={actions}
    />
  );
}
