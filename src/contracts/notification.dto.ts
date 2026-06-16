export type NotificationType =
  | 'inquiry.new'
  | 'inquiry.callback'
  | 'property.published'
  | 'property.review'
  | 'property.approved'
  | 'property.rejected'
  | 'subscription.activated'
  | 'subscription.cancelled'
  | 'user.welcome'
  | 'user.email-verified'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
  read: boolean;
  meta?: Record<string, unknown>;
  createdAt: string;
}
