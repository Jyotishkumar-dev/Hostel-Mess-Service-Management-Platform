import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComplaintDetail } from "@/components/feedback/complaint-detail";
import { AssignStaffForm } from "@/components/admin/assign-staff-form";
import {
  getAdminComplaint,
  listStaffProfiles,
} from "@/lib/admin/queries";
import { getAiAnalysis } from "@/lib/complaints/queries";
import { LoadFailure } from "@/components/feedback/load-failure";
import { applyAiSuggestionAction } from "@/lib/admin/actions";
import { triggerAiAnalysisAction } from "@/lib/admin/ai-action";
import { AiInsightsPanel } from "@/components/admin/ai-insights-panel";
import { AdminVerificationInfo } from "@/components/admin/admin-verification-info";

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

export default async function AdminIssuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const complaintResult = await getAdminComplaint(id);
  const staffResult = await listStaffProfiles();
  const aiResult = await getAiAnalysis(id);

  if (!complaintResult.ok) {
    return <LoadFailure message={complaintResult.error} retryHref="/admin/issues" />;
  }

  if (!complaintResult.data) notFound();

  const complaint = complaintResult.data;
  const staffOptions = staffResult.ok ? staffResult.data : [];
  const aiAnalysis = aiResult.ok ? aiResult.data : null;

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
      aiAnalysis={aiAnalysis}
      aiActions={
        <AiInsightsPanel
          complaintId={complaint.id}
          analysis={aiAnalysis}
          applyAction={applyAiSuggestionAction}
          retryAction={triggerAiAnalysisAction}
        />
      }
      verificationInfo={<AdminVerificationInfo complaint={complaint} />}
    />
  );
}
