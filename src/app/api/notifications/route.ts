import { NextResponse } from "next/server";
import { getUnreadCount, listMyNotifications } from "@/lib/notifications/queries";

export async function GET() {
  try {
    const [notifs, unread] = await Promise.all([listMyNotifications(50), getUnreadCount()]);
    return NextResponse.json({
      notifications: notifs.ok ? notifs.data : [],
      unread: unread.ok ? unread.data : 0,
    });
  } catch (error) {
    console.error("[api/notifications] error:", error);
    return NextResponse.json({ notifications: [], unread: 0 }, { status: 200 });
  }
}
