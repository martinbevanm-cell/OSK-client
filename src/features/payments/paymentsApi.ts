import { baseApi } from '@/store/api/baseApi';
import type {
  ApiSuccess,
  CreateIntentDto,
  CreateIntentResult,
  Payment,
} from '@contracts';

/** Payments server state — seller intent creation + admin moderation. */
export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /* ─── Seller ──────────────────────────────────────────────── */
    createPaymentIntent: build.mutation<CreateIntentResult, CreateIntentDto>({
      query: (body) => ({ url: '/payments/intent', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<CreateIntentResult>) => r.data,
      invalidatesTags: (result) =>
        result
          ? [
              { type: 'Payment' as const, id: 'MINE' },
              { type: 'Payment' as const, id: `BY-PROP-${result.payment.propertyId}` },
              { type: 'Property' as const, id: result.payment.propertyId },
            ]
          : [{ type: 'Payment' as const, id: 'MINE' }],
    }),

    listMyPayments: build.query<Payment[], void>({
      query: () => '/payments/mine',
      transformResponse: (r: ApiSuccess<Payment[]>) => r.data,
      providesTags: [{ type: 'Payment', id: 'MINE' }],
    }),

    listPropertyPayments: build.query<Payment[], string>({
      query: (propertyId) => `/payments/by-property/${propertyId}`,
      transformResponse: (r: ApiSuccess<Payment[]>) => r.data,
      providesTags: (_r, _e, propertyId) => [
        { type: 'Payment', id: `BY-PROP-${propertyId}` },
      ],
    }),

    /* ─── Admin ───────────────────────────────────────────────── */
    listAdminPayments: build.query<Payment[], void>({
      query: () => '/payments',
      transformResponse: (r: ApiSuccess<Payment[]>) => r.data,
      providesTags: [{ type: 'Payment', id: 'ADMIN' }],
    }),

    confirmPayment: build.mutation<Payment, string>({
      query: (id) => ({ url: `/payments/${id}/confirm`, method: 'POST' }),
      transformResponse: (r: ApiSuccess<Payment>) => r.data,
      invalidatesTags: (result) =>
        result
          ? [
              { type: 'Payment' as const, id: result.id },
              { type: 'Payment' as const, id: 'ADMIN' },
              { type: 'Payment' as const, id: 'MINE' },
              { type: 'Payment' as const, id: `BY-PROP-${result.propertyId}` },
              { type: 'Property' as const, id: result.propertyId },
              { type: 'PropertyList' as const, id: 'PARTIAL' },
              { type: 'PropertyList' as const, id: 'MINE' },
            ]
          : [{ type: 'Payment' as const, id: 'ADMIN' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreatePaymentIntentMutation,
  useListMyPaymentsQuery,
  useListPropertyPaymentsQuery,
  useListAdminPaymentsQuery,
  useConfirmPaymentMutation,
} = paymentsApi;
