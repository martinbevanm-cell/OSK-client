/**
 * Shared API envelope + pagination contracts.
 * Mirrors the backend response wrapper (osk-backend/src/shared/response).
 * Designed to be lifted into a published `@osk/contracts` package later.
 */

export const API_VERSION = 'v1' as const;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta | Record<string, unknown>;
  requestId: string;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
  requestId: string;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiErrorBody;

/** A page of results as consumed by the UI. */
export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface ListQuery {
  page?: number;
  limit?: number;
  sort?: string;
}
