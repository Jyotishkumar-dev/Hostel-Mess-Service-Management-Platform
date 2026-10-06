import { AlertTriangle, CheckCircle2, Clock, RotateCcw, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Complaint } from "@/types/complaint";

const VERIFICATION_LABELS: Record<string, string> = {
  pending: "Awaiting Verification",
  confirmed: "Verified",
  rejected: "Rejected — Reopened",
};

const VERIFICATION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  confirmed: CheckCircle2,
  rejected: RotateCcw,
};

/**
 * Admin-only panel that shows the verification state, reopen reason, and
 * resolution feedback for a complaint.
 */
export function AdminVerificationInfo({ complaint }: { complaint: Complaint }) {
  const Icon = VERIFICATION_ICONS[complaint.verificationStatus] ?? Clock;
  const label = VERIFICATION_LABELS[complaint.verificationStatus] ?? "Unknown";

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">Resolution Status</h3>

      <div className="flex items-center gap-2 text-sm">
        <Icon className="size-4 text-muted-foreground" />
        <span className="font-medium">{label}</span>
      </div>

      {complaint.verificationStatus === "rejected" && complaint.reopenReason ? (
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-muted-foreground">
              Reopen Reason
            </p>
            <p className="mt-1 text-sm">{complaint.reopenReason}</p>
            {complaint.reopenedAt ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Reopened on {complaint.reopenedAt}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {complaint.resolutionRating ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Resolution rating:</span>
          <span className="font-medium">{complaint.resolutionRating}/5</span>
        </div>
      ) : null}

      {complaint.resolutionFeedback ? (
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-muted-foreground">
              Student Feedback
            </p>
            <p className="mt-1 text-sm">{complaint.resolutionFeedback}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
