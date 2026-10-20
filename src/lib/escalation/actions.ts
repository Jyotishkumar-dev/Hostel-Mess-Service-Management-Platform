"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { createTypedServerClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth/session";
import { getEscalationThreshold } from "./config";
import { createNotification } from "@/lib/notifications/actions";

export async function runEscalationCheck() {
  await requireRole("admin");
  const supabase = await createTypedServerClient();
  if (!supabase) return { ok: false, escalated: 0 };

  const { data: complaints, error } = await (supabase as any)
    .from("complaints")
    .select("id, priority, status, created_at, escalated_at, assigned_staff_id, user_id")
    .in("status", ["assigned", "in_progress", "reopened"])
    .is("escalated_at", null);

  if (error) {
    console.error("[escalation] fetch failed:", error.message);
    return { ok: false, escalated: 0 };
  }

  let escalatedCount = 0;
  const now = Date.now();

  for (const c of (complaints ?? []) as any[]) {
    const thresholdHours = getEscalationThreshold(c.priority);
    const created = new Date(c.created_at).getTime();
    const hours = (now - created) / (1000 * 60 * 60);
    if (hours < thresholdHours) continue;

    const { error: updateError } = await (supabase as any)
      .from("complaints")
      .update({
        escalation_status: "escalated",
        escalated_at: new Date().toISOString(),
        escalation_reason: `Exceeded ${thresholdHours}h threshold for ${c.priority} priority`,
      } as any)
      .eq("id", c.id);

    if (updateError) continue;

    // Notify admins
    const { data: admins } = await (supabase as any).from("profiles").select("id").eq("role", "admin");
    for (const admin of (admins ?? []) as any[]) {
      await createNotification({
        userId: admin.id,
        type: "complaint_escalated",
        title: "Issue escalated",
        message: `Complaint has exceeded its expected resolution time. Priority: ${c.priority}. Current status: ${c.status}.`,
        complaintId: c.id,
      });
    }
    if (c.assigned_staff_id) {
      await createNotification({
        userId: c.assigned_staff_id,
        type: "complaint_escalated",
        title: "Assigned issue escalated",
        message: `Your assigned issue has exceeded its expected resolution time. Priority: ${c.priority}.`,
        complaintId: c.id,
      });
    }

    escalatedCount++;
  }

  revalidatePath("/admin/issues");
  revalidatePath("/admin");
  revalidatePath("/staff");
  return { ok: true, escalated: escalatedCount };
}
