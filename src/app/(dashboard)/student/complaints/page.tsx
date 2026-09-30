import type { Metadata } from "next";
import { ClipboardList, MessageSquarePlus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComplaintsBrowser } from "@/components/feedback/complaints-browser";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MOCK_STUDENT_COMPLAINTS } from "@/lib/mock";

export const metadata: Metadata = {
  title: "My Complaints",
};

export default function StudentComplaintsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={ClipboardList}
        title="My complaints"
        description="Every issue you have reported, with its current status."
        actions={
          <Button asChild>
            <Link href="/student/complaints/new">
              <MessageSquarePlus aria-hidden="true" />
              Submit feedback
            </Link>
          </Button>
        }
      />

      <ComplaintsBrowser
        complaints={MOCK_STUDENT_COMPLAINTS}
        basePath="/student/complaints"
        emptyTitle="No complaints yet"
        emptyDescription="When you report a hostel or mess issue it will appear here with its live status."
        emptyActionHref="/student/complaints/new"
        emptyActionLabel="Submit your first report"
      />
    </div>
  );
}
