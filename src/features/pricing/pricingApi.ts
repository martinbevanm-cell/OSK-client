import { baseApi } from '@/store/api/baseApi';
import type {
  ApiSuccess,
  CreatePricingPlanDto,
  ListingKind,
  PaymentSettings,
  PricingPlan,
  PropertyType,
  ResolvedPrice,
  UpdatePaymentSettingsDto,
  UpdatePricingPlanDto,
} from '@contracts';

/** Pricing server state — plans CRUD + global settings + resolver. */
export const pricingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /* ─── Plans (admin) ────────────────────────────────────────── */
    listPricingPlans: build.query<PricingPlan[], void>({
      query: () => '/pricing/plans',
      transformResponse: (r: ApiSuccess<PricingPlan[]>) => r.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: 'PricingPlan' as const, id: p.id })),
              { type: 'PricingPlan' as const, id: 'LIST' },
            ]
          : [{ type: 'PricingPlan' as const, id: 'LIST' }],
    }),

    createPricingPlan: build.mutation<PricingPlan, CreatePricingPlanDto>({
      query: (body) => ({ url: '/pricing/plans', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<PricingPlan>) => r.data,
      invalidatesTags: [{ type: 'PricingPlan', id: 'LIST' }],
    }),

    updatePricingPlan: build.mutation<
      PricingPlan,
      { id: string; body: UpdatePricingPlanDto }
    >({
      query: ({ id, body }) => ({
        url: `/pricing/plans/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (r: ApiSuccess<PricingPlan>) => r.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: 'PricingPlan', id: arg.id },
        { type: 'PricingPlan', id: 'LIST' },
      ],
    }),

    deletePricingPlan: build.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/pricing/plans/${id}`, method: 'DELETE' }),
      transformResponse: (r: ApiSuccess<{ id: string }>) => r.data,
      invalidatesTags: [{ type: 'PricingPlan', id: 'LIST' }],
    }),

    /* ─── Settings (read-public + admin write) ────────────────── */
    getPaymentSettings: build.query<PaymentSettings, void>({
      query: () => '/pricing/settings',
      transformResponse: (r: ApiSuccess<PaymentSettings>) => r.data,
      providesTags: [{ type: 'PaymentSettings', id: 'DEFAULT' }],
    }),

    updatePaymentSettings: build.mutation<
      PaymentSettings,
      UpdatePaymentSettingsDto
    >({
      query: (body) => ({
        url: '/pricing/settings',
        method: 'PATCH',
        body,
      }),
      transformResponse: (r: ApiSuccess<PaymentSettings>) => r.data,
      invalidatesTags: [{ type: 'PaymentSettings', id: 'DEFAULT' }],
    }),

    /* ─── Resolver (seller-facing preview) ─────────────────────── */
    resolvePrice: build.query<
      ResolvedPrice,
      {
        propertyType: PropertyType;
        listingKind: ListingKind;
        country: string;
        featured?: boolean;
      }
    >({
      query: (body) => ({
        url: '/pricing/resolve',
        method: 'POST',
        body,
      }),
      transformResponse: (r: ApiSuccess<ResolvedPrice>) => r.data,
    }),
  }),
  overrideExisting: false,
});

export const {
  useListPricingPlansQuery,
  useCreatePricingPlanMutation,
  useUpdatePricingPlanMutation,
  useDeletePricingPlanMutation,
  useGetPaymentSettingsQuery,
  useUpdatePaymentSettingsMutation,
  useResolvePriceQuery,
  useLazyResolvePriceQuery,
} = pricingApi;
