import { baseApi } from '@/store/api/baseApi';
import type {
  ApiSuccess,
  CreatePropertyDto,
  Paginated,
  PaginationMeta,
  Property,
  PropertyFilters,
  PropertySummary,
} from '@contracts';

/** Properties server state — injected into the shared baseApi. */
export const propertiesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listProperties: build.query<Paginated<PropertySummary>, Partial<PropertyFilters>>({
      query: (filters) => ({ url: '/properties', params: filters }),
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
              { type: 'PropertyList' as const, id: 'PARTIAL' },
            ]
          : [{ type: 'PropertyList' as const, id: 'PARTIAL' }],
    }),

    getProperty: build.query<Property, string>({
      query: (slug) => `/properties/${slug}`,
      transformResponse: (r: ApiSuccess<Property>) => r.data,
      providesTags: (result) => (result ? [{ type: 'Property', id: result.id }] : []),
    }),

    getFeaturedProperties: build.query<PropertySummary[], void>({
      query: () => ({
        url: '/properties',
        params: { isFeatured: true, limit: 8, sort: '-createdAt' },
      }),
      transformResponse: (r: ApiSuccess<PropertySummary[]>) => r.data,
      providesTags: [{ type: 'PropertyList', id: 'FEATURED' }],
    }),

    getPropertiesInViewport: build.query<
      PropertySummary[],
      { bbox: [number, number, number, number] }
    >({
      query: ({ bbox }) => ({
        url: '/properties/map',
        params: { bbox: bbox.join(',') },
      }),
      transformResponse: (r: ApiSuccess<PropertySummary[]>) => r.data,
    }),

    createProperty: build.mutation<Property, CreatePropertyDto>({
      query: (body) => ({ url: '/properties', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<Property>) => r.data,
      /* Bust BOTH list caches: PARTIAL is the public catalog feed
       * (so the new draft eventually shows up there when published)
       * and MINE is the seller's "My Listings" dashboard — without
       * the MINE invalidation a first-time seller submitting their
       * very first listing sees an empty page until a hard refresh. */
      invalidatesTags: [
        { type: 'PropertyList', id: 'PARTIAL' },
        { type: 'PropertyList', id: 'MINE' },
      ],
    }),

    listMyProperties: build.query<Paginated<PropertySummary>, Partial<PropertyFilters>>({
      query: (filters) => ({ url: '/properties/mine', params: filters }),
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
              { type: 'PropertyList' as const, id: 'MINE' },
            ]
          : [{ type: 'PropertyList' as const, id: 'MINE' }],
    }),

    submitPropertyForReview: build.mutation<Property, string>({
      query: (id) => ({ url: `/properties/${id}/submit`, method: 'POST' }),
      transformResponse: (r: ApiSuccess<Property>) => r.data,
      invalidatesTags: (_r, _e, id) => [
        { type: 'Property', id },
        { type: 'PropertyList', id: 'MINE' },
      ],
    }),

    /** Owner closes a deal — flips status to "sold". */
    markPropertySold: build.mutation<Property, string>({
      query: (id) => ({ url: `/properties/${id}/mark-sold`, method: 'POST' }),
      transformResponse: (r: ApiSuccess<Property>) => r.data,
      invalidatesTags: (_r, _e, id) => [
        { type: 'Property', id },
        { type: 'PropertyList', id: 'MINE' },
        { type: 'PropertyList', id: 'PARTIAL' },
      ],
    }),

    /** Owner re-lists a previously sold property — flips back to "draft". */
    reopenProperty: build.mutation<Property, string>({
      query: (id) => ({ url: `/properties/${id}/reopen`, method: 'POST' }),
      transformResponse: (r: ApiSuccess<Property>) => r.data,
      invalidatesTags: (_r, _e, id) => [
        { type: 'Property', id },
        { type: 'PropertyList', id: 'MINE' },
      ],
    }),

    /** Owner (or admin) hard-deletes a property. Cascades server-side
     *  to its inquiries, threads, messages and reviews, and frees up
     *  the owner's subscription slot. */
    deleteProperty: build.mutation<{ deleted: true }, string>({
      query: (id) => ({ url: `/properties/${id}`, method: 'DELETE' }),
      transformResponse: (r: ApiSuccess<{ deleted: true }>) => r.data,
      invalidatesTags: (_r, _e, id) => [
        { type: 'Property', id },
        { type: 'PropertyList', id: 'MINE' },
        { type: 'PropertyList', id: 'PARTIAL' },
        { type: 'Subscription', id: 'ME' },
      ],
    }),

    updateProperty: build.mutation<
      Property,
      { id: string; body: Partial<CreatePropertyDto> }
    >({
      query: ({ id, body }) => ({
        url: `/properties/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (r: ApiSuccess<Property>) => r.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Property', id: arg.id },
        { type: 'PropertyList', id: 'MINE' },
        { type: 'PropertyList', id: 'PARTIAL' },
      ],
    }),

    /** Fire-and-forget +1 to a listing's view count. */
    recordPropertyView: build.mutation<{ recorded: true }, string>({
      query: (id) => ({
        url: `/properties/${id}/view`,
        method: 'POST',
      }),
      transformResponse: (r: ApiSuccess<{ recorded: true }>) => r.data,
    }),

    /** Per-listing view + inquiry counts for the signed-in owner. */
    getMyAnalytics: build.query<
      {
        totals: { views: number; inquiries: number; listings: number };
        items: Array<{
          id: string;
          slug: string;
          title: string;
          thumbnail: string;
          status: string;
          views: number;
          inquiries: number;
        }>;
      },
      void
    >({
      query: () => '/properties/me/analytics',
      transformResponse: (
        r: ApiSuccess<{
          totals: { views: number; inquiries: number; listings: number };
          items: Array<{
            id: string;
            slug: string;
            title: string;
            thumbnail: string;
            status: string;
            views: number;
            inquiries: number;
          }>;
        }>,
      ) => r.data,
      providesTags: [{ type: 'PropertyList', id: 'MY-ANALYTICS' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListPropertiesQuery,
  useGetPropertyQuery,
  useGetFeaturedPropertiesQuery,
  useGetPropertiesInViewportQuery,
  useCreatePropertyMutation,
  useListMyPropertiesQuery,
  useSubmitPropertyForReviewMutation,
  useMarkPropertySoldMutation,
  useReopenPropertyMutation,
  useDeletePropertyMutation,
  useUpdatePropertyMutation,
  useRecordPropertyViewMutation,
  useGetMyAnalyticsQuery,
} = propertiesApi;
