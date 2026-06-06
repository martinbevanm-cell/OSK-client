import { baseApi } from '@/store/api/baseApi';
import type {
  ApiSuccess,
  Notification,
  Paginated,
  PaginationMeta,
} from '@contracts';

interface ListMeta extends PaginationMeta {
  unread: number;
}

interface NotificationsListResult extends Paginated<Notification> {
  unread: number;
}

/** Notifications server state — list + mark-read for the current user. */
export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listNotifications: build.query<
      NotificationsListResult,
      { read?: boolean; page?: number; limit?: number } | void
    >({
      query: (args) => ({
        url: '/notifications',
        params: args ?? undefined,
      }),
      transformResponse: (r: ApiSuccess<Notification[]>) => {
        const meta = (r.meta ?? {}) as Partial<ListMeta>;
        return {
          items: r.data,
          meta: {
            page: meta.page ?? 1,
            limit: meta.limit ?? 24,
            total: meta.total ?? r.data.length,
            pages: meta.pages ?? 1,
          },
          unread: meta.unread ?? 0,
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((n) => ({
                type: 'Notification' as const,
                id: n.id,
              })),
              { type: 'Notification' as const, id: 'LIST' },
            ]
          : [{ type: 'Notification' as const, id: 'LIST' }],
    }),
    markNotificationRead: build.mutation<Notification, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'POST' }),
      transformResponse: (r: ApiSuccess<Notification>) => r.data,
      invalidatesTags: (_r, _e, id) => [
        { type: 'Notification', id },
        { type: 'Notification', id: 'LIST' },
      ],
    }),
    markAllNotificationsRead: build.mutation<{ updated: number }, void>({
      query: () => ({ url: '/notifications/read-all', method: 'POST' }),
      transformResponse: (r: ApiSuccess<{ updated: number }>) => r.data,
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;
