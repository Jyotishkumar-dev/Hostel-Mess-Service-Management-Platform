import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessageSquarePlus, ShieldCheck } from "lucide-react";
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
        title="Submit Feedback"
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

        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card className="h-fit">
            <CardContent className="pt-2">
              <h2 className="text-sm font-medium">What happens next</h2>
              <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground"
                  />
                  Your report is recorded with the status{" "}
                  <strong className="font-medium text-foreground">Reported</strong>{" "}
                  and a reference number.
                </li>
                <li className="flex gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground"
                  />
                  An admin reviews it and passes it to the hostel or mess team
                  responsible.
                </li>
                <li className="flex gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground"
                  />
                  You follow the status here, then confirm whether the fix held.
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardContent className="pt-2">
              <h2 className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                Who can see this
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Only you and the staff handling your report. Photos are stored
                privately and are never visible to other students.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}