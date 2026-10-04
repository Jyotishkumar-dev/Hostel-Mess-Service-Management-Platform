"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserRound, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignComplaintAction } from "@/lib/admin/actions";
import { INITIAL_ADMIN_STATE } from "@/lib/admin/state";
import type { StaffOption } from "@/lib/admin/queries";

/**
 * Routes an issue onto a support staff member. The POST is a Server Action
 * that calls `assign_complaint`; the staff list is fetched by the admin page so
 * the client never guesses who is allowed.
 */
export function AssignStaffForm({
  complaintId,
  staffOptions,
}: {
  complaintId: string;
  staffOptions: StaffOption[];
}) {
  const router = useRouter();
  const [state, startAction, isPending] = useActionState(
    assignComplaintAction,
    INITIAL_ADMIN_STATE,
  );

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state.status, router]);

  return (
    <form action={startAction} className="flex flex-col gap-3">
      <input type="hidden" name="complaintId" value={complaintId} />

      {state.status === "error" ? (
        <p role="alert" className="text-sm text-destructive">{state.message}</p>
      ) : null}
      {state.status === "success" ? (
        <div className="flex items-center gap-2 text-sm text-status-resolved">
          <CheckCircle2 className="size-4" />
          <span>{state.message}</span>
        </div>
      ) : null}

      <Select name="staffId" required disabled={isPending || staffOptions.length === 0}>
        <SelectTrigger aria-label="Select a staff member">
          <SelectValue placeholder="Route to a staff member…" />
        </SelectTrigger>
        <SelectContent>
          {staffOptions.length === 0 ? (
            <SelectItem value="" disabled>
              No staff on record
            </SelectItem>
          ) : (
            staffOptions.map((staff) => (
              <SelectItem key={staff.id} value={staff.id}>
                <span className="flex items-center gap-2">
                  <UserRound className="size-4" />
                  {staff.name}
                </span>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
            Assigning…
          </>
        ) : (
          <>Assign</>
        )}
      </Button>
    </form>
  );
}
