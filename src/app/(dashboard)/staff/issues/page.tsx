import type { Metadata } from "next";
import { ListChecks } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComplaintsBrowser } from "@/components/feedback/complaints-browser";
import { listStaffComplaints } from "@/lib/complaints/queries";
import { LoadFailure } from "@/components/feedback/load-failure";

export const metadata: Metadata = {
  title: "Assigned Issues",
};

export default async function StaffIssuesPage() {
  const result = await listStaffComplaints();

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          icon={ListChecks}
          title="Assigned issues"
          description="Everything routed to you, with the status you last reported."
        />
        <LoadFailure message={result.error} retryHref="/staff/issues" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={ListChecks}
        title="Assigned issues"
        description="Everything routed to you, with the status you last reported."
      />

      <ComplaintsBrowser
        complaints={result.data}
        basePath="/staff/issues"
        emptyTitle="No assigned issues"
        emptyDescription="When an admin routes an issue to you it will appear here with full context."
      />
    </div>
  );
}
