import { baseApi } from '@/store/api/baseApi';
import type {
  ApiSuccess,
  Inquiry,
  InquiryFilters,
  Paginated,
  PaginationMeta,
  UpdateInquiryDto,
} from '@contracts';

/** Inquiries server state — owner / admin dashboard. */
export const inquiriesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listInquiries: build.query<Paginated<Inquiry>, Partial<InquiryFilters>>({
      query: (filters) => ({ url: '/inquiries', params: filters }),
      transformResponse: (r: ApiSuccess<Inquiry[]>) => ({
        items: r.data,
        meta: r.meta as PaginationMeta,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((i) => ({
                type: 'Inquiry' as const,
                id: i.id,
              })),
              { type: 'Inquiry' as const, id: 'LIST' },
            ]
          : [{ type: 'Inquiry' as const, id: 'LIST' }],
    }),
    updateInquiryStatus: build.mutation<Inquiry, { id: string; body: UpdateInquiryDto }>({
      query: ({ id, body }) => ({
        url: `/inquiries/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (r: ApiSuccess<Inquiry>) => r.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Inquiry', id: arg.id },
        { type: 'Inquiry', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const { useListInquiriesQuery, useUpdateInquiryStatusMutation } = inquiriesApi;
