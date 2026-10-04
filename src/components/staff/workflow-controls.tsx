"use client";

import {
  useEffect,
  useTransition,
  useState,
  useActionState,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Play, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/feedback/image-uploader";
import { resolutionFormSchema } from "@/lib/validations/complaint";
import { startWorkAction, resolveComplaintAction } from "@/lib/staff/actions";
import { INITIAL_STAFF_STATE } from "@/lib/staff/state";
import type { ComplaintStatus } from "@/types/complaint";
import type { ResolutionNoteValues } from "@/lib/validations/complaint";

type Props = {
  complaintId: string;
  reference: string;
  status: ComplaintStatus;
};

/**
 * The staff-only controls rendered on a complaint detail page.
 *
 * Renders exactly one affordance for the complaint's current lifecycle state:
 * the *Start working* button for `assigned`/`reopened`, and the resolution form
 * once work is `in_progress`. Every mutation is a Server Action guarded by the
 * `advance_complaint` SECURITY DEFINER function, so the UI state here is only a
 * convenience layer over a database-enforced workflow.
 */
export function StaffWorkflowControls({ complaintId, reference, status }: Props) {
  const router = useRouter();

  const [startState, startAction, startPending] = useActionState(
    startWorkAction,
    INITIAL_STAFF_STATE,
  );
  useEffect(() => {
    if (startState.status === "success") router.refresh();
  }, [startState.status, router]);

  const [resolveState, resolveAction, resolvePending] = useActionState(
    resolveComplaintAction,
    INITIAL_STAFF_STATE,
  );
  useEffect(() => {
    if (resolveState.status === "success") router.refresh();
  }, [resolveState.status, router]);

  if (status === "resolved") {
    return (
      <div className="flex items-start gap-2.5 rounded-lg border border-status-resolved/25 bg-status-resolved-bg/50 px-3.5 py-2.5 text-sm">
        <CheckCircle2 className="mt-0.5 size-4 text-status-resolved" />
        <span>This issue has been marked as resolved.</span>
      </div>
    );
  }

  if (status === "in_progress") {
    return (
      <ResolutionForm
        complaintId={complaintId}
        reference={reference}
        action={resolveAction}
        state={resolveState}
        isPending={resolvePending}
      />
    );
  }

  // assigned | reopened | reported (reported is not reachable here in practice)
  return (
    <div className="flex flex-col gap-3">
      {startState.status === "error" ? (
        <p role="alert" className="text-sm text-destructive">{startState.message}</p>
      ) : null}
      {startState.status === "success" ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-status-in-progress/25 bg-status-in-progress-bg/50 px-3.5 py-2.5 text-sm">
          <CheckCircle2 className="mt-0.5 size-4 text-status-in-progress" />
          <span>{startState.message ?? "Issue marked as in progress."}</span>
        </div>
      ) : null}

      <form action={startAction}>
        <input type="hidden" name="complaintId" value={complaintId} />
        <Button
          type="submit"
          disabled={startPending || status === "reported"}
          className="w-full sm:w-auto"
        >
          {startPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              Starting…
            </>
          ) : (
            <>
              <Play className="mr-2 size-4" aria-hidden="true" />
              Start Working
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

interface ResolutionFormProps {
  complaintId: string;
  reference: string;
  action: (payload: FormData) => void;
  state: { status: "idle" | "success" | "error"; message?: string; fieldErrors?: Record<string, string> };
  isPending: boolean;
}

function ResolutionForm({
  complaintId,
  reference,
  action,
  state,
  isPending,
}: ResolutionFormProps) {
  const [photo, setPhoto] = useState<File | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ResolutionNoteValues>({
    resolver: zodResolver(resolutionFormSchema),
    defaultValues: { note: "" },
  });

  useEffect(() => {
    const noteError = state.fieldErrors?.note;
    if (noteError) setError("note", { type: "server", message: noteError });
  }, [state, setError]);

  const [, startTransition] = useTransition();

  const onSubmit = handleSubmit((values) => {
    clearErrors();

    const payload = new FormData();
    payload.set("complaintId", complaintId);
    payload.set("note", values.note);
    if (photo) payload.set("photo", photo);

    startTransition(() => action(payload));
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="complaintId" value={complaintId} />

      <div>
        <label
          htmlFor={`resolution-note-${complaintId}`}
          className="text-sm font-medium"
        >
          Resolution note
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          Explain what was done. This is saved against {reference} and shown to
          whoever reviews this complaint.
        </p>
        <Textarea
          id={`resolution-note-${complaintId}`}
          rows={4}
          disabled={isPending}
          {...register("note")}
          className="mt-2"
        />
        {errors.note ? (
          <p role="alert" className="mt-1.5 text-sm text-destructive">
            {errors.note.message}
          </p>
        ) : null}
        {state.message && state.status === "error" && !state.fieldErrors ? (
          <p role="alert" className="mt-1.5 text-sm text-destructive">
            {state.message}
          </p>
        ) : null}
      </div>

      <ImageUploader
        onChange={setPhoto}
        error={state.fieldErrors?.photo}
        disabled={isPending}
      />

      {state.status === "success" ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-status-resolved/25 bg-status-resolved-bg/50 px-3.5 py-2.5 text-sm">
          <CheckCircle2 className="mt-0.5 size-4 text-status-resolved" />
          <span>{state.message ?? "Issue marked as resolved."}</span>
        </div>
      ) : null}

      <div className="pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              Resolving…
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 size-4" aria-hidden="true" />
              Mark as Resolved
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
