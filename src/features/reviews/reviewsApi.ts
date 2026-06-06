import { baseApi } from '@/store/api/baseApi';
import type {
  ApiSuccess,
  CreateReviewDto,
  Paginated,
  PaginationMeta,
  Review,
} from '@contracts';

/** Property reviews — public list + auth-required create. */
export const reviewsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listPropertyReviews: build.query<Paginated<Review>, string>({
      query: (propertyId) => ({
        url: '/reviews',
        params: { propertyId, limit: 20 },
      }),
      transformResponse: (r: ApiSuccess<Review[]>) => ({
        items: r.data,
        meta: r.meta as PaginationMeta,
      }),
      providesTags: (result, _e, propertyId) =>
        result
          ? [
              ...result.items.map((rv) => ({
                type: 'Review' as const,
                id: rv.id,
              })),
              { type: 'Review' as const, id: `prop:${propertyId}` },
            ]
          : [{ type: 'Review' as const, id: `prop:${propertyId}` }],
    }),

    createReview: build.mutation<Review, CreateReviewDto>({
      query: (body) => ({ url: '/reviews', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<Review>) => r.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Review', id: `prop:${arg.propertyId}` },
      ],
    }),

    deleteReview: build.mutation<
      { ok: true },
      { id: string; propertyId: string }
    >({
      query: ({ id }) => ({ url: `/reviews/${id}`, method: 'DELETE' }),
      transformResponse: (r: ApiSuccess<{ ok: true }>) => r.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Review', id: arg.id },
        { type: 'Review', id: `prop:${arg.propertyId}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListPropertyReviewsQuery,
  useCreateReviewMutation,
  useDeleteReviewMutation,
} = reviewsApi;
