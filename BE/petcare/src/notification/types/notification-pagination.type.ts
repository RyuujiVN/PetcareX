export enum NotificationFilter {
  ALL = 'ALL',
  UNREAD = 'UNREAD',
}

export type NotificationPagination = {
  limit: number;
  recipientId: string;
  filter: NotificationFilter;
  createdAt?: Date;
};
