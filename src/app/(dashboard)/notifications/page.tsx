import type { Metadata } from "next";
import Link from "next/link";
import { Bell, BellOff, CheckCheck, Clock, ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listMyNotifications, getUnreadCount } from "@/lib/notifications/queries";
import { markAllNotificationsRead } from "@/lib/notifications/actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Notifications",
};

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
  const unreadCount = unread.ok ? unread.data : 0;
  const notifications = notifs.ok ? notifs.data : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        description="Updates, assignments, and resolution alerts for your campus activity."
        actions={
          unreadCount > 0 ? (
            <form
              action={async () => {
                "use server";
                await markAllNotificationsRead();
              }}
            >
              <Button variant="outline" size="sm" type="submit">
                <CheckCheck className="size-4" aria-hidden="true" />
                Mark all as read
              </Button>
            </form>
          ) : null
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="All caught up"
          description="You have no notifications right now. Any status updates on your reports or assignments will show up here."
        />
      ) : (
        <div className="grid gap-3">
          {notifications.map((n) => {
            const href = getLink(n, user.role);
            const isClickable = href !== "#";

            return (
              <div
                key={n.id}
                className={`relative flex items-start gap-4 rounded-2xl p-4.5 transition-all duration-200 ${
                  n.isRead
                    ? "neu-glass bg-card/60 opacity-80 hover:opacity-100"
                    : "neu-glass-card border-l-4 border-l-primary shadow-sm"
                }`}
              >
                <span
                  className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${
                    n.isRead
                      ? "neu-inset-sm bg-muted text-muted-foreground"
                      : "neu-raised-sm bg-primary/15 text-primary"
                  }`}
                  aria-hidden="true"
                >
                  <Bell className="size-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" aria-hidden="true" />
                      {formatDateTime(n.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {n.message}
                  </p>
                  {isClickable ? (
                    <div className="mt-3">
                      <Button asChild variant="ghost" size="xs" className="h-7 px-2.5 text-xs text-primary font-medium">
                        <Link href={href}>
                          View related record
                          <ExternalLink className="size-3" aria-hidden="true" />
                        </Link>
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
