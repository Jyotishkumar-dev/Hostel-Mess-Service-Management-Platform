"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, RefreshCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyAiSuggestionAction } from "@/lib/admin/actions";
import { triggerAiAnalysisAction } from "@/lib/admin/ai-action";
import type { AdminActionState } from "@/lib/admin/state";
import type { AiAnalysis, ComplaintCategory } from "@/types/complaint";
import { CATEGORY_LABELS } from "@/config/status";

const INITIAL_ADMIN_STATE: AdminActionState = { status: "idle" };

export function AiInsightsPanel({
  complaintId,
  analysis,
  applyAction,
  retryAction,
}: {
  complaintId: string;
  analysis: AiAnalysis | null | undefined;
  applyAction: (
    _prev: AdminActionState,
    formData: FormData,
  ) => Promise<AdminActionState>;
  retryAction: (
    _prev: AdminActionState,
    formData: FormData,
  ) => Promise<AdminActionState>;
}) {
  if (!analysis) {
    return (
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">AI Insights</h3>
        <p className="text-xs text-muted-foreground">
          AI analysis has not run yet for this complaint.
        </p>
        <form action={retryAction}>
          <input type="hidden" name="complaintId" value={complaintId} />
          <Button type="submit" variant="outline" size="sm" className="w-full">
            <RefreshCcw className="mr-2 size-3.5" aria-hidden="true" />
            Run analysis
          </Button>
        </form>
      </div>
    );
  }

  const isPending = analysis.processingStatus === "processing";
  const isFailed = analysis.processingStatus === "failed";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">AI Insights</h3>
        {isFailed ? (
          <form action={retryAction}>
            <input type="hidden" name="complaintId" value={complaintId} />
            <Button type="submit" variant="ghost" size="sm">
              <RefreshCcw className="mr-2 size-3.5" aria-hidden="true" />
              Retry
            </Button>
          </form>
        ) : null}
      </div>

      {isPending ? (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          Analysing feedback…
        </div>
      ) : isFailed ? (
        <div className="flex items-start gap-2 rounded-lg border border-status-resolved/25 bg-status-resolved-bg/50 px-3.5 py-2.5 text-sm">
          <AlertTriangle className="mt-0.5 size-4 text-status-resolved" aria-hidden="true" />
          <span>
            AI analysis is unavailable. The complaint can still be reviewed and
            resolved manually.
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <InsightRow
            label="Suggested Category"
            value={
              analysis.category
                ? CATEGORY_LABELS[analysis.category as ComplaintCategory]
                : null
            }
            confidence={analysis.confidence}
          />
          <InsightRow
            label="Suggested Priority"
            value={
              analysis.priority
                ? analysis.priority[0].toUpperCase() + analysis.priority.slice(1)
                : null
            }
            confidence={analysis.confidence}
          />
          <div>
            <p className="text-xs text-muted-foreground">Suggested Department</p>
            <p className="mt-0.5 text-sm">{analysis.department ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Summary</p>
            <p className="mt-0.5 text-sm leading-relaxed">
              {analysis.summary ?? "—"}
            </p>
          </div>

          {analysis.duplicateCandidate ? (
            <div className="rounded-lg border border-status-resolved/25 bg-status-resolved-bg/50 px-3.5 py-2.5 text-sm">
              <p className="font-medium">Possible duplicate</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {analysis.duplicateReason ??
                  "A similar unresolved complaint was found."}
              </p>
              {analysis.duplicateComplaintId ? (
                <p className="mt-1 font-mono text-xs">
                  {analysis.duplicateComplaintId}
                </p>
              ) : null}
            </div>
          ) : null}

          {!analysis.confirmed ? (
            <ConfirmForm
              complaintId={complaintId}
              analysis={analysis}
              applyAction={applyAction}
            />
          ) : (
            <div className="flex items-center gap-2 text-xs text-status-resolved">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              AI suggestion applied
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InsightRow({
  label,
  value,
  confidence,
}: {
  label: string;
  value: string | null;
  confidence: number | null;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 flex items-center gap-2">
        <p className="text-sm font-medium">{value ?? "—"}</p>
        {confidence !== null ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            {Math.round(confidence * 100)}%
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ConfirmForm({
  complaintId,
  analysis,
  applyAction,
}: {
  complaintId: string;
  analysis: AiAnalysis;
  applyAction: (
    _prev: AdminActionState,
    formData: FormData,
  ) => Promise<AdminActionState>;
}) {
  const [applyState, startApply, applyPending] = useActionState(
    applyAction,
    INITIAL_ADMIN_STATE,
  );

  if (!analysis.category || !analysis.priority) return null;

  return (
    <form action={startApply} className="flex flex-col gap-2">
      <input type="hidden" name="complaintId" value={complaintId} />
      <input type="hidden" name="category" value={analysis.category} />
      <input type="hidden" name="priority" value={analysis.priority} />
      <Button type="submit" disabled={applyPending} size="sm" className="w-full">
        {applyPending ? (
          <>
            <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden="true" />
            Applying…
          </>
        ) : (
          <>Apply AI suggestion</>
        )}
      </Button>
      {applyState.status === "error" ? (
        <p role="alert" className="text-xs text-destructive">
          {applyState.message}
        </p>
      ) : null}
    </form>
  );
}
