/** Responses of `/v1/notifications` (ASM-001-S08). */
export class NotificationItem {
  id: string;
  /** e.g. `LOW_GRADE_HOMEROOM`, `UNPUBLISHED_GRADES_REMINDER`, `JOIN_REQUEST`. */
  type: string;
  title: string;
  message: string;
  read: boolean;
  relatedId: string | null;
  createdAt: string;
}

export class NotificationList {
  /** Newest first. */
  notifications: NotificationItem[];
  /** All of the caller's unread notifications, not only those listed. */
  unread: number;
}
