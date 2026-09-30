import type { Metadata } from "next";
import { ListChecks } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComplaintsBrowser } from "@/components/feedback/complaints-browser";
import { MOCK_ASSIGNED_COMPLAINTS } from "@/lib/mock";

export const metadata: Metadata = {
  title: "Assigned Issues",
};

export default function StaffIssuesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={ListChecks}
        title="Assigned issues"
        description="Everything routed to you, with the status you last reported."
      />

      <ComplaintsBrowser
        complaints={MOCK_ASSIGNED_COMPLAINTS}
        basePath="/staff/issues"
        showStudent
        emptyTitle="No assigned issues"
        emptyDescription="When an admin routes an issue to your team it will appear here with full context."
      />
    </div>
  );
}
