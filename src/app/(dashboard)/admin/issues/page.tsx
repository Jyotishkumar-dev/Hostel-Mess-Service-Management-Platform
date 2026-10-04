import type { Metadata } from "next";
import { ListChecks } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComplaintsBrowser } from "@/components/feedback/complaints-browser";
import { listAllComplaints } from "@/lib/admin/queries";
import { LoadFailure } from "@/components/feedback/load-failure";

export const metadata: Metadata = {
  title: "Issues",
};

/**
 * The admin issue register.
 *
 * Every complaint on campus, narrowed by the `complaints_select_admin` RLS
 * policy — the page never sees rows it is not allowed to read. The filter bar
 * is shared with the student and staff lists, so the three screens behave
 * identically.
 */
export default async function AdminIssuesPage() {
  const result = await listAllComplaints();

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          icon={ListChecks}
          title="Issue register"
          description="Every reported issue across hostel and mess services, ready to triage and prioritise."
        />
        <LoadFailure message={result.error} retryHref="/admin/issues" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={ListChecks}
        title="Issue register"
        description="Every reported issue across hostel and mess services, ready to triage and prioritise."
      />

      <ComplaintsBrowser
        complaints={result.data}
        basePath="/admin/issues"
        emptyTitle="No issues reported"
        emptyDescription="Once students start submitting feedback, their reports will queue up here for triage."
      />
    </div>
  );
}
