/** Admin overview metrics returned by GET /admin/overview. */
export interface AdminOverview {
  users: { total: number; agents: number; blocked: number };
  properties: { total: number; pending: number; published: number };
  inquiries: { total: number };
  reviews: { total: number };
}

/** Row shape for the admin review moderation list. */
export interface AdminReview {
  id: string;
  propertyId: string;
  rating: number;
  title?: string;
  body: string;
  status: 'pending' | 'approved' | 'rejected';
  authorName: string;
  authorEmail: string;
  createdAt: string;
}

/** Whitelist of audited actions — keep aligned with the backend enum. */
export type AuditAction =
  | 'user.role.update'
  | 'user.status.update'
  | 'property.approve'
  | 'property.reject'
  | 'review.delete';

/** Single row from GET /admin/audit-logs. */
export interface AuditEntry {
  id: string;
  actorId: string;
  actorEmail: string;
  actorName: string;
  action: AuditAction;
  entityType: 'user' | 'property' | 'review';
  entityId: string;
  meta?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}
