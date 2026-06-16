import { baseApi } from '@/store/api/baseApi';
import type { ApiSuccess, PaginationMeta } from '@contracts';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  source: string;
  /** ISO timestamp; null when active. */
  unsubscribedAt: string | null;
  createdAt: string;
}

/**
 * Marketing endpoints — newsletter subscribe + admin management.
 */
export const marketingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    subscribeNewsletter: build.mutation<
      { subscribed: true },
      { email: string; source?: string }
    >({
      query: (body) => ({ url: '/marketing/subscribe', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<{ subscribed: true }>) => r.data,
      invalidatesTags: [{ type: 'NewsletterSubscriber', id: 'LIST' }],
    }),

    listSubscribers: build.query<
      {
        items: NewsletterSubscriber[];
        meta: PaginationMeta;
        activeTotal: number;
      },
      {
        page?: number;
        limit?: number;
        q?: string;
        status?: 'active' | 'unsubscribed' | 'all';
      }
    >({
      query: (args) => ({
        url: '/admin/subscribers',
        params: {
          page: args.page ?? 1,
          limit: args.limit ?? 50,
          ...(args.q ? { q: args.q } : {}),
          ...(args.status ? { status: args.status } : {}),
        },
      }),
      transformResponse: (
        r: ApiSuccess<{ items: NewsletterSubscriber[]; activeTotal: number }> & {
          meta: PaginationMeta;
        },
      ) => ({
        items: r.data.items,
        activeTotal: r.data.activeTotal,
        meta: r.meta,
      }),
      providesTags: [{ type: 'NewsletterSubscriber', id: 'LIST' }],
    }),

    unsubscribeSubscriber: build.mutation<{ unsubscribed: true }, string>({
      query: (id) => ({ url: `/admin/subscribers/${id}`, method: 'DELETE' }),
      transformResponse: (r: ApiSuccess<{ unsubscribed: true }>) => r.data,
      invalidatesTags: [{ type: 'NewsletterSubscriber', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useSubscribeNewsletterMutation,
  useListSubscribersQuery,
  useUnsubscribeSubscriberMutation,
} = marketingApi;
