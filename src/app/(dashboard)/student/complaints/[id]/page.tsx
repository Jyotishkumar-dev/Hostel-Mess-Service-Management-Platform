import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComplaintDetail } from "@/components/feedback/complaint-detail";
import { getMyComplaint } from "@/lib/complaints/queries";
import { StudentVerificationSection } from "@/components/student/verification-section";

export const metadata: Metadata = {
  title: "Complaint",
};

export default async function StudentComplaintPage({
  params,
}: PageProps<"/student/complaints/[id]">) {
  const { id } = await params;
  const result = await getMyComplaint(id);

  if (!result.ok) {
    throw new Error(result.error);
  }

  if (!result.data) notFound();

  const complaint = result.data;
  const needsVerification =
    complaint.status === "resolved" && complaint.verificationStatus === "pending";

  return (
    <ComplaintDetail
      complaint={complaint}
      backHref="/student/complaints"
      backLabel="Back to my complaints"
      showStudent
      actions={
        needsVerification ? (
          <StudentVerificationSection
            complaintId={complaint.id}
            reference={complaint.reference}
            resolutionNote={complaint.resolutionNote}
            resolutionImageUrl={complaint.resolutionImageUrl}
          />
        ) : null
      }
    />
  );
}
