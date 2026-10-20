export type NotificationType =
  | "complaint_created"
  | "complaint_assigned"
  | "complaint_in_progress"
  | "complaint_resolved"
  | "verification_required"
  | "complaint_reopened"
  | "complaint_escalated"
  | "critical_complaint";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedComplaintId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_complaint_id: string | null;
  is_read: boolean;
  created_at: string;
}
