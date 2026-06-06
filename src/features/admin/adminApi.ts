import { baseApi } from '@/store/api/baseApi';
import type {
  AdminOverview,
  AdminReview,
  ApiSuccess,
  AuditEntry,
  AuthResult,
  Paginated,
  PaginationMeta,
  Property,
  PropertySummary,
  User,
  UserRole,
} from '@contracts';
import { impersonationStarted } from '@/features/auth';

interface ListParams {
  page?: number;
  limit?: number;
  q?: string;
}

interface UpdateUserBody {
  role?: UserRole;
  status?: 'active' | 'blocked';
}

/** Admin server state — overview, moderation, user management. */
export const adminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /* ── overview ─────────────────────────────────────────────────────── */
    getAdminOverview: build.query<AdminOverview, void>({
      query: () => '/admin/overview',
      transformResponse: (r: ApiSuccess<AdminOverview>) => r.data,
      providesTags: [{ type: 'AdminOverview', id: 'TOTAL' }],
    }),

    /* ── moderation queue ─────────────────────────────────────────────── */
    listPendingProperties: build.query<
      Paginated<PropertySummary>,
      ListParams | void
    >({
      query: (args) => ({
        url: '/admin/properties/pending',
        params: args ?? undefined,
      }),
      transformResponse: (r: ApiSuccess<PropertySummary[]>) => ({
        items: r.data,
        meta: r.meta as PaginationMeta,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((p) => ({
                type: 'Property' as const,
                id: p.id,
              })),
              { type: 'PropertyList' as const, id: 'PENDING' },
            ]
          : [{ type: 'PropertyList' as const, id: 'PENDING' }],
    }),

    approvePropertyAdmin: build.mutation<Property, string>({
      query: (id) => ({
        url: `/admin/properties/${id}/approve`,
        method: 'POST',
      }),
      transformResponse: (r: ApiSuccess<Property>) => r.data,
      invalidatesTags: (_r, _e, id) => [
        { type: 'Property', id },
        { type: 'PropertyList', id: 'PENDING' },
        { type: 'PropertyList', id: 'PARTIAL' },
        { type: 'AdminOverview', id: 'TOTAL' },
        { type: 'AuditLog', id: 'FEED' },
      ],
    }),

    rejectPropertyAdmin: build.mutation<Property, string>({
      query: (id) => ({
        url: `/admin/properties/${id}/reject`,
        method: 'POST',
      }),
      transformResponse: (r: ApiSuccess<Property>) => r.data,
      invalidatesTags: (_r, _e, id) => [
        { type: 'Property', id },
        { type: 'PropertyList', id: 'PENDING' },
        { type: 'AdminOverview', id: 'TOTAL' },
        { type: 'AuditLog', id: 'FEED' },
      ],
    }),

    /** Flip the isFeatured flag on a property. Audit-logged on the server. */
    setPropertyFeatured: build.mutation<
      Property,
      { id: string; isFeatured: boolean }
    >({
      query: ({ id, isFeatured }) => ({
        url: `/admin/properties/${id}/featured`,
        method: 'PATCH',
        body: { isFeatured },
      }),
      transformResponse: (r: ApiSuccess<Property>) => r.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Property', id: arg.id },
        { type: 'PropertyList', id: 'FEATURED' },
        { type: 'PropertyList', id: 'PARTIAL' },
        { type: 'PropertyList', id: 'ADMIN-ALL' },
        { type: 'AuditLog', id: 'FEED' },
      ],
    }),

    /** Admin-only published-listings browse (so they can feature/unfeature). */
    listAdminProperties: build.query<
      Paginated<PropertySummary>,
      (ListParams & { isFeatured?: boolean }) | void
    >({
      query: (args) => ({
        url: '/properties',
        params: { ...(args ?? {}), limit: args?.limit ?? 24 },
      }),
      transformResponse: (r: ApiSuccess<PropertySummary[]>) => ({
        items: r.data,
        meta: r.meta as PaginationMeta,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((p) => ({
                type: 'Property' as const,
                id: p.id,
              })),
              { type: 'PropertyList' as const, id: 'ADMIN-ALL' },
            ]
          : [{ type: 'PropertyList' as const, id: 'ADMIN-ALL' }],
    }),

    /* ── user management ──────────────────────────────────────────────── */
    listAdminUsers: build.query<Paginated<User>, ListParams | void>({
      query: (args) => ({ url: '/admin/users', params: args ?? undefined }),
      transformResponse: (r: ApiSuccess<User[]>) => ({
        items: r.data,
        meta: r.meta as PaginationMeta,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((u) => ({
                type: 'User' as const,
                id: u.id,
              })),
              { type: 'User' as const, id: 'LIST' },
            ]
          : [{ type: 'User' as const, id: 'LIST' }],
    }),

    updateAdminUser: build.mutation<User, { id: string; body: UpdateUserBody }>({
      query: ({ id, body }) => ({
        url: `/admin/users/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (r: ApiSuccess<User>) => r.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: 'User', id: arg.id },
        { type: 'User', id: 'LIST' },
        { type: 'AdminOverview', id: 'TOTAL' },
        { type: 'AuditLog', id: 'FEED' },
      ],
    }),

    /**
     * Mint a session for the target user and overlay it on the current
     * admin session. The admin's existing refresh cookie is preserved
     * server-side (no Set-Cookie on this response); the slice stashes the
     * admin's previous access token in memory so "Stop impersonating" is
     * a pure local restore.
     */
    impersonateUser: build.mutation<AuthResult, string>({
      query: (id) => ({
        url: `/admin/users/${id}/impersonate`,
        method: 'POST',
      }),
      transformResponse: (r: ApiSuccess<AuthResult>) => r.data,
      async onQueryStarted(_id, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(impersonationStarted(data));
        /* Other RTK caches were populated for the admin — wipe them so
         * UI re-reads as the target user (their listings, inquiries,
         * notifications, etc.). */
        dispatch(adminApi.util.resetApiState());
      },
      invalidatesTags: [{ type: 'AuditLog', id: 'FEED' }],
    }),

    /* ── review moderation ────────────────────────────────────────────── */
    listAdminReviews: build.query<Paginated<AdminReview>, ListParams | void>({
      query: (args) => ({ url: '/admin/reviews', params: args ?? undefined }),
      transformResponse: (r: ApiSuccess<AdminReview[]>) => ({
        items: r.data,
        meta: r.meta as PaginationMeta,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((r2) => ({
                type: 'Review' as const,
                id: r2.id,
              })),
              { type: 'Review' as const, id: 'ADMIN' },
            ]
          : [{ type: 'Review' as const, id: 'ADMIN' }],
    }),

    deleteAdminReview: build.mutation<{ id: string; deleted: true }, string>({
      query: (id) => ({ url: `/admin/reviews/${id}`, method: 'DELETE' }),
      transformResponse: (r: ApiSuccess<{ id: string; deleted: true }>) => r.data,
      invalidatesTags: (_r, _e, id) => [
        { type: 'Review', id },
        { type: 'Review', id: 'ADMIN' },
        { type: 'AdminOverview', id: 'TOTAL' },
        { type: 'AuditLog', id: 'FEED' },
      ],
    }),

    /* ── audit log feed ───────────────────────────────────────────────── */
    listAuditLogs: build.query<Paginated<AuditEntry>, ListParams | void>({
      query: (args) => ({
        url: '/admin/audit-logs',
        params: args ?? undefined,
      }),
      transformResponse: (r: ApiSuccess<AuditEntry[]>) => ({
        items: r.data,
        meta: r.meta as PaginationMeta,
      }),
      providesTags: [{ type: 'AuditLog', id: 'FEED' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAdminOverviewQuery,
  useListPendingPropertiesQuery,
  useApprovePropertyAdminMutation,
  useRejectPropertyAdminMutation,
  useSetPropertyFeaturedMutation,
  useListAdminPropertiesQuery,
  useListAdminUsersQuery,
  useUpdateAdminUserMutation,
  useImpersonateUserMutation,
  useListAdminReviewsQuery,
  useDeleteAdminReviewMutation,
  useListAuditLogsQuery,
} = adminApi;
