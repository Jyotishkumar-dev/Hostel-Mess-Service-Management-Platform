import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, MessageSquarePlus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComplaintsBrowser } from "@/components/feedback/complaints-browser";
import { Button } from "@/components/ui/button";
import { listMyComplaints } from "@/lib/complaints/queries";

export const metadata: Metadata = {
  title: "My Complaints",
};

/**
 * The student's complaint list.
 *
 * Reads through `listMyComplaints`, whose RLS policy can only ever return rows
 * owned by the signed-in student. The page never filters by owner itself —
 * ownership is decided in the database.
 */
export default async function StudentComplaintsPage() {
  const result = await listMyComplaints();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Complaints"
        description="Everything you have reported, and where each issue stands."
        actions={
          <Button asChild>
            <Link href="/student/complaints/new">
              <MessageSquarePlus aria-hidden="true" />
              Submit Feedback
            </Link>
          </Button>
        }
      />

      {result.ok ? (
        <ComplaintsBrowser
          complaints={result.data}
          basePath="/student/complaints"
          emptyTitle="No feedback submitted yet"
          emptyDescription="If something in your hostel or mess needs attention, submit your first feedback and we will pass it to the right team."
          emptyActionHref="/student/complaints/new"
          emptyActionLabel="Submit Feedback"
        />
      ) : (
        <LoadFailure message={result.error} />
      )}
    </div>
  );
}

/**
 * A database failure is shown without the raw message: Postgres errors can name
 * tables, columns and constraints, which is information a student should not
 * have. The real message is written to the server log instead.
 */
function LoadFailure({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed px-6 py-16">
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive"
      >
        <AlertTriangle className="size-5" />
      </span>
      <div>
        <h2 className="text-base font-semibold">
          We could not load your complaints
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
      <Button asChild variant="outline">
        <Link href="/student/complaints">Try again</Link>
      </Button>
    </div>
  );
}