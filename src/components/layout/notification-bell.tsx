"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
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
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>Recent updates</SheetDescription>
        </SheetHeader>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{unread} unread</p>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAll}>
              Mark all as read
            </Button>
          )}
        </div>
        <div className="mt-4 space-y-2 max-h-[70vh] overflow-y-auto">
          {notifications.length === 0 && <p className="text-sm text-muted-foreground">No notifications</p>}
          {notifications.slice(0, 20).map((n) => (
            <Link
              key={n.id}
              href={getLink(n, role)}
              onClick={() => {
                if (!n.isRead) markRead(n.id);
                setOpen(false);
              }}
              className={`block rounded-lg border p-3 text-sm ${n.isRead ? "bg-background" : "bg-muted/40"}`}
            >
              <div className="flex items-start gap-2">
                {!n.isRead && <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />}
                <div className="flex-1">
                  <p className="font-medium">{n.title}</p>
                  <p className="mt-1 text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-4">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/notifications" onClick={() => setOpen(false)}>
              View all notifications
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
