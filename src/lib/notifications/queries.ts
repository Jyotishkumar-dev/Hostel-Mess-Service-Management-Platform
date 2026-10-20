import "server-only";

import { cache } from "react";
import { createTypedServerClient } from "@/lib/supabase";
import { requireUser } from "@/lib/auth/session";
import type { Notification, NotificationRow } from "@/types/notification";

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    relatedComplaintId: row.related_complaint_id,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export const listMyNotifications = cache(
  async (limit = 50): Promise<{ ok: true; data: Notification[] } | { ok: false; error: string }> => {
    const supabase = await createTypedServerClient();
    if (!supabase) return { ok: false, error: "Storage not configured" };
    const user = await requireUser();

    const { data, error } = await (supabase as any)
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[notifications] list failed:", error.message);
      return { ok: false, error: "Failed to load notifications" };
    }

    return { ok: true, data: ((data ?? []) as NotificationRow[]).map(toNotification) };
  },
);

export const getUnreadCount = cache(
  async (): Promise<{ ok: true; data: number } | { ok: false; error: string }> => {
    const supabase = await createTypedServerClient();
    if (!supabase) return { ok: false, error: "Storage not configured" };
    const user = await requireUser();

    const { count, error } = await (supabase as any)
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      console.error("[notifications] count failed:", error.message);
      return { ok: false, error: "Failed to load count" };
    }
    return { ok: true, data: count ?? 0 };
  },
);
