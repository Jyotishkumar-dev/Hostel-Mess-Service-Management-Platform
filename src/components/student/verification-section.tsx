"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { verifyResolutionAction } from "@/lib/student/actions";
import { rejectResolutionAction } from "@/lib/student/actions";
import { submitResolutionFeedbackAction } from "@/lib/student/actions";
import type { StudentActionState } from "@/lib/student/state";

const INITIAL_STATE: StudentActionState = { status: "idle" };

/**
 * Renders the student verification section when a complaint is resolved and
 * awaiting verification. The actual mutations are Server Actions guarded by
 * `student_verify_resolution` and `student_reject_resolution`, which enforce
 * ownership and state machine rules at the database level.
 */
export function StudentVerificationSection({
  complaintId,
  reference,
  resolutionNote,
  resolutionImageUrl,
}: {
  complaintId: string;
  reference: string;
  resolutionNote?: string;
  resolutionImageUrl: string | null;
}) {
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyResolutionAction,
    INITIAL_STATE,
  );

  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectResolutionAction,
    INITIAL_STATE,
  );

  const [feedbackState, feedbackAction, feedbackPending] = useActionState(
    submitResolutionFeedbackAction,
    INITIAL_STATE,
  );

  const isVerifying = verifyState.status === "success";
  const isRejecting = rejectState.status === "success";

  if (isVerifying || isRejecting) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-2.5">
            {isVerifying ? (
              <CheckCircle2 className="mt-0.5 size-5 text-status-resolved" />
            ) : (
              <XCircle className="mt-0.5 size-5 text-status-in-progress" />
            )}
            <div>
              <p className="text-sm font-medium">
                {isVerifying
                  ? "Resolution confirmed"
                  : "Complaint reopened"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {isVerifying
                  ? verifyState.message ?? "Thank you for confirming."
                  : rejectState.message ?? "The complaint has been reopened."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-medium">Resolution update for {reference}</h3>

          {resolutionNote ? (
            <div className="mt-3 rounded-lg bg-muted/40 px-3.5 py-2.5 text-sm">
              <p className="text-xs font-medium text-muted-foreground">
                Resolution note
              </p>
              <p className="mt-1">{resolutionNote}</p>
            </div>
          ) : null}

          {resolutionImageUrl ? (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolutionImageUrl}
                alt="Resolution evidence"
                className="max-h-64 w-full rounded-lg object-contain"
              />
            </div>
          ) : null}

          <p className="mt-4 text-sm">
            Has this issue been fixed for you?
          </p>

          <form action={verifyAction} className="mt-3 flex flex-col gap-3">
            <input type="hidden" name="complaintId" value={complaintId} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="submit"
                disabled={verifyPending || rejectPending}
                className="flex-1"
              >
                {verifyPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Confirming…
                  </>
                ) : (
                  "Yes, it's fixed"
                )}
              </Button>
              <Button
                type="submit"
                variant="outline"
                disabled={verifyPending || rejectPending}
                className="flex-1"
                formAction={rejectAction}
              >
                {rejectPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Reopening…
                  </>
                ) : (
                  "No, the issue still exists"
                )}
              </Button>
            </div>
            {verifyState.status === "error" ? (
              <p role="alert" className="text-xs text-destructive">
                {verifyState.message}
              </p>
            ) : null}
            {rejectState.status === "error" && !rejectState.fieldErrors?.reopenReason ? (
              <p role="alert" className="text-xs text-destructive">
                {rejectState.message}
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <ReopenReasonForm
        complaintId={complaintId}
        action={rejectAction}
        state={rejectState}
        isPending={rejectPending}
      />

      <ResolutionFeedbackForm
        complaintId={complaintId}
        action={feedbackAction}
        state={feedbackState}
        isPending={feedbackPending}
      />
    </div>
  );
}

function ReopenReasonForm({
  complaintId,
  action,
  state,
  isPending,
}: {
  complaintId: string;
  action: (formData: FormData) => void;
  state: StudentActionState;
  isPending: boolean;
}) {
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="complaintId" value={complaintId} />
      <div>
        <Label htmlFor={`reopen-reason-${complaintId}`}>
          What is still wrong? <span className="text-destructive">*</span>
        </Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Please describe the remaining issue so the assigned staff can address it.
        </p>
        <Textarea
          id={`reopen-reason-${complaintId}`}
          name="reopenReason"
          rows={3}
          required
          minLength={10}
          disabled={isPending}
          className="mt-2"
          placeholder="The water cooler is still not dispensing water…"
        />
        {state.fieldErrors?.reopenReason ? (
          <p role="alert" className="mt-1.5 text-xs text-destructive">
            {state.fieldErrors.reopenReason}
          </p>
        ) : null}
        {state.status === "error" && !state.fieldErrors?.reopenReason ? (
          <p role="alert" className="mt-1.5 text-xs text-destructive">
            {state.message}
          </p>
        ) : null}
      </div>
      <Button type="submit" variant="destructive" disabled={isPending} className="w-full">
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Reopening…
          </>
        ) : (
          "Reopen complaint"
        )}
      </Button>
    </form>
  );
}

function ResolutionFeedbackForm({
  complaintId,
  action,
  state,
  isPending,
}: {
  complaintId: string;
  action: (formData: FormData) => void;
  state: StudentActionState;
  isPending: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-sm font-medium">Resolution feedback</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Optional. Help us improve by rating the resolution.
        </p>
        <form action={action} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="complaintId" value={complaintId} />
          <div>
            <Label htmlFor={`rating-${complaintId}`}>Rating (1–5)</Label>
            <select
              id={`rating-${complaintId}`}
              name="rating"
              disabled={isPending}
              className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a rating</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "star" : "stars"}
                </option>
              ))}
            </select>
            {state.fieldErrors?.rating ? (
              <p role="alert" className="mt-1.5 text-xs text-destructive">
                {state.fieldErrors.rating}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor={`comment-${complaintId}`}>Comment (optional)</Label>
            <Textarea
              id={`comment-${complaintId}`}
              name="comment"
              rows={2}
              maxLength={500}
              disabled={isPending}
              className="mt-2"
              placeholder="The issue was fixed quickly, thank you…"
            />
            {state.fieldErrors?.comment ? (
              <p role="alert" className="mt-1.5 text-xs text-destructive">
                {state.fieldErrors.comment}
              </p>
            ) : null}
          </div>
          <Button type="submit" variant="outline" disabled={isPending} className="w-full">
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save feedback"
            )}
          </Button>
          {feedbackState.status === "success" ? (
            <p role="status" className="text-xs text-status-resolved">
              {feedbackState.message}
            </p>
          ) : null}
          {feedbackState.status === "error" && !feedbackState.fieldErrors ? (
            <p role="alert" className="text-xs text-destructive">
              {feedbackState.message}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
