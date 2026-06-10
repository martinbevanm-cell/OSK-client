import { baseApi } from '@/store/api/baseApi';
import type {
  ApiSuccess,
  Message,
  SendMessageDto,
  StartThreadDto,
  Thread,
} from '@contracts';

/** Threads + messages server state — polled, Socket.IO upgrade later. */
export const messagesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listThreads: build.query<Thread[], void>({
      query: () => '/threads',
      transformResponse: (r: ApiSuccess<Thread[]>) => r.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((t) => ({ type: 'Thread' as const, id: t.id })),
              { type: 'Thread' as const, id: 'LIST' },
            ]
          : [{ type: 'Thread' as const, id: 'LIST' }],
    }),
    startThread: build.mutation<Thread, StartThreadDto>({
      query: (body) => ({ url: '/threads', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<Thread>) => r.data,
      invalidatesTags: [{ type: 'Thread', id: 'LIST' }],
    }),
    listMessages: build.query<Message[], string>({
      query: (threadId) => `/threads/${threadId}/messages`,
      transformResponse: (r: ApiSuccess<Message[]>) => r.data,
      providesTags: (_r, _e, threadId) => [{ type: 'Message', id: threadId }],
    }),
    sendMessage: build.mutation<Message, { threadId: string; body: SendMessageDto }>({
      query: ({ threadId, body }) => ({
        url: `/threads/${threadId}/messages`,
        method: 'POST',
        body,
      }),
      transformResponse: (r: ApiSuccess<Message>) => r.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Message', id: arg.threadId },
        { type: 'Thread', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListThreadsQuery,
  useStartThreadMutation,
  useListMessagesQuery,
  useSendMessageMutation,
} = messagesApi;
