import { baseApi } from '@/store/api/baseApi';
import type {
  ApiSuccess,
  CreateSubscriptionPlanDto,
  SubscribeDto,
  SubscribeResult,
  Subscription,
  SubscriptionPlan,
  UpdateSubscriptionPlanDto,
} from '@contracts';

/** Subscription plans + user subscriptions — injected into baseApi. */
export const subscriptionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /* ─── Catalog (plans) ──────────────────────────────────────── */
    listSubscriptionPlans: build.query<SubscriptionPlan[], void>({
      query: () => '/subscription-plans',
      transformResponse: (r: ApiSuccess<SubscriptionPlan[]>) => r.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({
                type: 'SubscriptionPlan' as const,
                id: p.id,
              })),
              { type: 'SubscriptionPlan' as const, id: 'LIST' },
            ]
          : [{ type: 'SubscriptionPlan' as const, id: 'LIST' }],
    }),

    listSubscriptionPlansAdmin: build.query<SubscriptionPlan[], void>({
      query: () => '/subscription-plans/admin',
      transformResponse: (r: ApiSuccess<SubscriptionPlan[]>) => r.data,
      providesTags: [{ type: 'SubscriptionPlan', id: 'ADMIN' }],
    }),

    createSubscriptionPlan: build.mutation<SubscriptionPlan, CreateSubscriptionPlanDto>({
      query: (body) => ({ url: '/subscription-plans', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<SubscriptionPlan>) => r.data,
      invalidatesTags: [
        { type: 'SubscriptionPlan', id: 'LIST' },
        { type: 'SubscriptionPlan', id: 'ADMIN' },
      ],
    }),

    updateSubscriptionPlan: build.mutation<
      SubscriptionPlan,
      { id: string; body: UpdateSubscriptionPlanDto }
    >({
      query: ({ id, body }) => ({
        url: `/subscription-plans/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (r: ApiSuccess<SubscriptionPlan>) => r.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: 'SubscriptionPlan', id: arg.id },
        { type: 'SubscriptionPlan', id: 'LIST' },
        { type: 'SubscriptionPlan', id: 'ADMIN' },
      ],
    }),

    deleteSubscriptionPlan: build.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/subscription-plans/${id}`, method: 'DELETE' }),
      transformResponse: (r: ApiSuccess<{ id: string }>) => r.data,
      invalidatesTags: [
        { type: 'SubscriptionPlan', id: 'LIST' },
        { type: 'SubscriptionPlan', id: 'ADMIN' },
      ],
    }),

    /* ─── Per-user subscription ────────────────────────────────── */
    getMySubscription: build.query<Subscription | null, void>({
      query: () => '/subscriptions/me',
      transformResponse: (r: ApiSuccess<Subscription | null>) => r.data,
      providesTags: [{ type: 'Subscription', id: 'MINE' }],
    }),

    subscribe: build.mutation<SubscribeResult, SubscribeDto>({
      query: (body) => ({
        url: '/subscriptions/subscribe',
        method: 'POST',
        body,
      }),
      transformResponse: (r: ApiSuccess<SubscribeResult>) => r.data,
      invalidatesTags: [{ type: 'Subscription', id: 'MINE' }],
    }),

    cancelSubscription: build.mutation<Subscription, void>({
      query: () => ({ url: '/subscriptions/cancel', method: 'POST' }),
      transformResponse: (r: ApiSuccess<Subscription>) => r.data,
      invalidatesTags: [{ type: 'Subscription', id: 'MINE' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListSubscriptionPlansQuery,
  useListSubscriptionPlansAdminQuery,
  useCreateSubscriptionPlanMutation,
  useUpdateSubscriptionPlanMutation,
  useDeleteSubscriptionPlanMutation,
  useGetMySubscriptionQuery,
  useSubscribeMutation,
  useCancelSubscriptionMutation,
} = subscriptionsApi;
