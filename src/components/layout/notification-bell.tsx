"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/notifications/actions";
import type { Notification } from "@/types/notification";

function getLink(n: Notification, role: string) {
  if (!n.relatedComplaintId) return "/notifications";
  if (role === "student") return `/student/complaints/${n.relatedComplaintId}`;
  if (role === "staff") return `/staff/issues/${n.relatedComplaintId}`;
  if (role === "admin") return `/admin/issues/${n.relatedComplaintId}`;
  return "/notifications";
}

export function NotificationBell({ role }: { role: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnread(data.unread || 0);
      })
      .catch(() => {});
  }, []);

  async function markRead(id: string) {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  }

  async function markAll() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative neu-interactive bg-card rounded-xl size-9.5" aria-label="Notifications">
          <Bell className="size-4.5 text-foreground" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground neu-glow-primary">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md bg-card neu-raised-lg border-l border-white/40 dark:border-white/5">
        <SheetHeader>
          <SheetTitle className="text-base font-semibold">Notifications</SheetTitle>
          <SheetDescription className="text-xs">Real-time resolution & escalation updates</SheetDescription>
        </SheetHeader>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{unread} unread</p>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAll} className="text-xs">
              Mark all as read
            </Button>
          )}
        </div>
        <div className="mt-4 space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
          {notifications.length === 0 && (
            <div className="rounded-2xl neu-inset-sm p-6 text-center text-sm text-muted-foreground">
              No notifications at this time
            </div>
          )}
          {notifications.slice(0, 20).map((n) => (
            <Link
              key={n.id}
              href={getLink(n, role)}
              onClick={() => {
                if (!n.isRead) markRead(n.id);
                setOpen(false);
              }}
              className={cn(
                "block rounded-2xl p-4 text-sm transition-all duration-200",
                n.isRead
                  ? "neu-raised-sm bg-card/60 opacity-80 hover:opacity-100"
                  : "neu-interactive bg-card border-l-4 border-l-primary",
              )}
            >
              <div className="flex items-start gap-2.5">
                {!n.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary shadow-xs" />}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{n.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-normal">{n.message}</p>
                  <p className="mt-2 text-[10px] font-mono text-muted-foreground/70">{new Date(n.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t">
          <Button variant="outline" className="w-full rounded-xl" asChild>
            <Link href="/notifications" onClick={() => setOpen(false)}>
              View all notifications
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
