import type { GeoPoint } from './property.dto';

/** Public agent shape returned by GET /agents. */
export interface AgentPublic {
  id: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AgentProfile {
  id: string;
  userId: string;
  name: string;
  agencyName?: string;
  avatarUrl?: string;
  bio?: string;
  verified: boolean;
  phoneMasked?: string;
  serviceArea?: GeoPoint;
  ratingAvg: number;
  ratingCount: number;
}

export interface AgentMetrics {
  agentId: string;
  activeListings: number;
  totalLeads: number;
  /** Share of inquiries responded to, 0..1. */
  responseRate: number;
  /** Median first-response time in minutes. */
  medianResponseMinutes: number;
}
