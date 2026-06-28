export type NotificationCategory =
  | "welcome"
  | "features"
  | "billing"
  | "product";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  createdAt: string;
  href?: string;
  read: boolean;
};

export type NotificationState = {
  readIds: string[];
};
