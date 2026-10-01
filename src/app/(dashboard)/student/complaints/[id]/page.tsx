import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComplaintDetail } from "@/components/feedback/complaint-detail";
import { getMyComplaint } from "@/lib/complaints/queries";

export const metadata: Metadata = {
  title: "Complaint",
};

/**
 * A single complaint owned by the signed-in student.
 *
 * `getMyComplaint` returns null both when the id does not exist and when it
 * belongs to somebody else, and this page renders the same 404 for both. That
 * is deliberate: a "not found" for one case and a "no access" for the other
 * would confirm which complaint ids are real.
 */
export default async function StudentComplaintPage({
  params,
}: PageProps<"/student/complaints/[id]">) {
  const { id } = await params;
  const result = await getMyComplaint(id);

  // A storage or network failure is a server-side problem, not a missing page,
  // so it must not be turned into a 404.
  if (!result.ok) {
    throw new Error(result.error);
  }

  if (!result.data) notFound();

  return (
    <ComplaintDetail
      complaint={result.data}
      backHref="/student/complaints"
      backLabel="Back to my complaints"
      showStudent
    />
  );
}