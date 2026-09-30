import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessageSquarePlus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComplaintForm } from "@/components/forms/complaint-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Submit Feedback",
};

export default function NewComplaintPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={MessageSquarePlus}
        title="Submit feedback"
        description="Tell us what is wrong and which team should look at it."
        actions={
          <Button asChild variant="outline">
            <Link href="/student/complaints">
              <ArrowLeft data-icon="inline-start" aria-hidden="true" />
              Back to my complaints
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-2">
            <ComplaintForm />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent className="pt-2">
            <h2 className="text-sm font-medium">What happens next</h2>
            <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground"
                />
                An admin reviews the report and sets its priority.
              </li>
              <li className="flex gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground"
                />
                It is assigned to the hostel or mess team responsible.
              </li>
              <li className="flex gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground"
                />
                You follow the status, then confirm whether the fix held.
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
