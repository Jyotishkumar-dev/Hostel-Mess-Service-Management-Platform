import type { Metadata } from "next";
import { ListChecks } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComplaintsBrowser } from "@/components/feedback/complaints-browser";
import { MOCK_COMPLAINTS } from "@/lib/mock";

export const metadata: Metadata = {
  title: "Issues",
};

export default function AdminIssuesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={ListChecks}
        title="Issue register"
        description="Every reported issue across hostel and mess services, ready to triage and prioritise."
      />

      <ComplaintsBrowser
        complaints={MOCK_COMPLAINTS}
        basePath="/admin/issues"
        showStudent
        emptyTitle="No issues reported"
        emptyDescription="Once students start submitting feedback, their reports will queue up here for triage."
      />

      <p className="text-xs text-muted-foreground">
        Sample records for the Phase 1 preview. Assignment and status changes
        are wired up in Phase 2.
      </p>
    </div>
  );
}
