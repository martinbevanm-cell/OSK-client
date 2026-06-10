import { baseApi } from '@/store/api/baseApi';
import type { ApiSuccess, PaymentSettings, UpdatePaymentSettingsDto } from '@contracts';

/**
 * Pricing server state — payment configuration only.
 *
 * The plans matrix + resolver have been removed in favour of the
 * subscription model. See `features/subscriptions/subscriptionsApi.ts`
 * for plans + subscribe.
 */
export const pricingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPaymentSettings: build.query<PaymentSettings, void>({
      query: () => '/pricing/settings',
      transformResponse: (r: ApiSuccess<PaymentSettings>) => r.data,
      providesTags: [{ type: 'PaymentSettings', id: 'DEFAULT' }],
    }),

    updatePaymentSettings: build.mutation<PaymentSettings, UpdatePaymentSettingsDto>({
      query: (body) => ({
        url: '/pricing/settings',
        method: 'PATCH',
        body,
      }),
      transformResponse: (r: ApiSuccess<PaymentSettings>) => r.data,
      invalidatesTags: [{ type: 'PaymentSettings', id: 'DEFAULT' }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetPaymentSettingsQuery, useUpdatePaymentSettingsMutation } =
  pricingApi;
