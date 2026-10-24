"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { createTypedServerClient } from "@/lib/supabase";
import { requireUser } from "@/lib/auth/session";
import type { NotificationType } from "@/types/notification";

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  complaintId?: string | null;
}) {
  try {
    const supabase = await createTypedServerClient();
    if (!supabase) return { ok: false };
    const { error } = await supabase.rpc(
      "create_notification",
      {
        p_user_id: params.userId,
        p_type: params.type,
        p_title: params.title,
        p_message: params.message,
        p_complaint_id: params.complaintId ?? null,
      },
    );
    if (error) {
      console.error("[notifications] create failed:", error.message);
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.error("[notifications] create error:", e);
    return { ok: false };
  }
}

export async function markNotificationRead(id: string) {
  const supabase = await createTypedServerClient();
  if (!supabase) return { ok: false };
  const user = await requireUser();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false };
  revalidatePath("/notifications");
  return { ok: true };
}

export async function markAllNotificationsRead() {
  const supabase = await createTypedServerClient();
  if (!supabase) return { ok: false };
  const user = await requireUser();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);
  if (error) return { ok: false };
  revalidatePath("/notifications");
  return { ok: true };
}
