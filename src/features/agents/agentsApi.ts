import { baseApi } from '@/store/api/baseApi';
import type {
  AgentPublic,
  ApiSuccess,
  Paginated,
  PaginationMeta,
  PropertySummary,
} from '@contracts';

export interface AgentsListParams {
  q?: string;
  page?: number;
  limit?: number;
}

/** Public agents directory — list + detail. */
export const agentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listAgents: build.query<Paginated<AgentPublic>, AgentsListParams | void>({
      query: (args) => ({ url: '/agents', params: args ?? undefined }),
      transformResponse: (r: ApiSuccess<AgentPublic[]>) => ({
        items: r.data,
        meta: r.meta as PaginationMeta,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((a) => ({
                type: 'Agent' as const,
                id: a.id,
              })),
              { type: 'Agent' as const, id: 'LIST' },
            ]
          : [{ type: 'Agent' as const, id: 'LIST' }],
    }),
    getAgent: build.query<AgentPublic, string>({
      query: (id) => `/agents/${id}`,
      transformResponse: (r: ApiSuccess<AgentPublic>) => r.data,
      providesTags: (result) => (result ? [{ type: 'Agent', id: result.id }] : []),
    }),
    listAgentListings: build.query<
      Paginated<PropertySummary>,
      { id: string; page?: number; limit?: number }
    >({
      query: ({ id, page, limit }) => ({
        url: `/agents/${id}/listings`,
        params: { page, limit },
      }),
      transformResponse: (r: ApiSuccess<PropertySummary[]>) => ({
        items: r.data,
        meta: r.meta as PaginationMeta,
      }),
      providesTags: (result, _err, arg) =>
        result
          ? [
              ...result.items.map((p) => ({
                type: 'Property' as const,
                id: p.id,
              })),
              { type: 'PropertyList' as const, id: `AGENT-${arg.id}` },
            ]
          : [{ type: 'PropertyList' as const, id: `AGENT-${arg.id}` }],
    }),
  }),
  overrideExisting: false,
});

export const { useListAgentsQuery, useGetAgentQuery, useListAgentListingsQuery } =
  agentsApi;
