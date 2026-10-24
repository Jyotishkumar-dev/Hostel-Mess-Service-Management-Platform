import { requireUser } from "@/lib/auth";
import { listMyNotifications, getUnreadCount } from "@/lib/notifications/queries";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { markAllNotificationsRead } from "@/lib/notifications/actions";

function getLink(n: { relatedComplaintId: string | null }, role: string) {
  if (!n.relatedComplaintId) return "#";
  if (role === "student") return `/student/complaints/${n.relatedComplaintId}`;
  if (role === "staff") return `/staff/issues/${n.relatedComplaintId}`;
  if (role === "admin") return `/admin/issues/${n.relatedComplaintId}`;
  return "#";
}

export default async function NotificationsPage() {
  const user = await requireUser();
  const [notifs, unread] = await Promise.all([listMyNotifications(100), getUnreadCount()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">{unread.ok ? unread.data : 0} unread</p>
        </div>
        {unread.ok && unread.data > 0 && (
          <form action={async () => {
            "use server";
            await markAllNotificationsRead();
          }}>
            <Button variant="outline" size="sm">
              Mark all as read
            </Button>
          </form>
        )}
      </div>

      <div className="space-y-2">
        {notifs.ok && notifs.data.length === 0 && (
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        )}
        {notifs.ok &&
          notifs.data.map((n) => (
            <Link
              key={n.id}
              href={getLink(n, user.role)}
              className={`block rounded-lg border p-4 ${n.isRead ? "bg-background" : "bg-muted/40"}`}
            >
              <div className="flex items-start gap-2">
                {!n.isRead && <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500" />}
                <div className="flex-1">
                  <p className="font-medium">{n.title}</p>
                  <p className="mt-1 text-muted-foreground">{n.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}
