import { baseApi } from '@/store/api/baseApi';
import type {
  ApiSuccess,
  CallbackRequestDto,
  CallIntentDto,
  ContactGeneralDto,
  ContactMessage,
  ContactMessagePatchDto,
  ContactMessageStatus,
  Inquiry,
  InquiryDto,
  PaginationMeta,
  WhatsAppLinkResult,
} from '@contracts';

/**
 * Contact-channel server state — the email/call/WhatsApp channels.
 * (In-app chat is realtime and lives in the messaging feature / Socket.IO.)
 */
export const contactApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** Email channel — secure relay; owner email is never exposed. */
    submitInquiry: build.mutation<Inquiry, InquiryDto>({
      query: (body) => ({ url: '/contact/inquiry', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<Inquiry>) => r.data,
      invalidatesTags: [{ type: 'Inquiry', id: 'LIST' }],
    }),

    /** Call channel — fire-and-forget analytics for click-to-call intent. */
    logCallIntent: build.mutation<{ logged: boolean }, CallIntentDto>({
      query: (body) => ({ url: '/contact/call-intent', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<{ logged: boolean }>) => r.data,
    }),

    /** Call channel — request-a-callback with preferred time slots. */
    requestCallback: build.mutation<Inquiry, CallbackRequestDto>({
      query: (body) => ({
        url: '/contact/callback-request',
        method: 'POST',
        body,
      }),
      transformResponse: (r: ApiSuccess<Inquiry>) => r.data,
      invalidatesTags: [{ type: 'Inquiry', id: 'LIST' }],
    }),

    /** WhatsApp channel — server builds the wa.me link with a prefilled template. */
    getWhatsAppLink: build.query<WhatsAppLinkResult, string>({
      query: (propertyId) => `/contact/whatsapp-link/${propertyId}`,
      transformResponse: (r: ApiSuccess<WhatsAppLinkResult>) => r.data,
    }),

    /** Public general-contact form — admins receive the message. */
    submitContactGeneral: build.mutation<
      { id: string; received: true },
      ContactGeneralDto
    >({
      query: (body) => ({ url: '/contact/general', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<{ id: string; received: true }>) => r.data,
      invalidatesTags: [{ type: 'ContactMessage', id: 'LIST' }],
    }),

    /** Admin: list contact messages with optional status filter. */
    listContactMessages: build.query<
      { items: ContactMessage[]; unread: number; meta: PaginationMeta },
      { page?: number; limit?: number; status?: ContactMessageStatus }
    >({
      query: (args) => ({
        url: '/admin/contact-messages',
        params: {
          page: args.page ?? 1,
          limit: args.limit ?? 20,
          ...(args.status ? { status: args.status } : {}),
        },
      }),
      transformResponse: (
        r: ApiSuccess<{ items: ContactMessage[]; unread: number }> & {
          meta: PaginationMeta;
        },
      ) => ({ items: r.data.items, unread: r.data.unread, meta: r.meta }),
      providesTags: [{ type: 'ContactMessage', id: 'LIST' }],
    }),

    /** Admin: mark replied / closed + save admin note. */
    updateContactMessage: build.mutation<
      ContactMessage,
      { id: string; body: ContactMessagePatchDto }
    >({
      query: ({ id, body }) => ({
        url: `/admin/contact-messages/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (r: ApiSuccess<ContactMessage>) => r.data,
      invalidatesTags: [{ type: 'ContactMessage', id: 'LIST' }],
    }),

    /** Admin: send an email reply to the visitor inline. On success
     *  the backend marks the message replied, so the list refetches
     *  via the invalidation tag and the row updates. */
    replyToContactMessage: build.mutation<ContactMessage, { id: string; body: string }>({
      query: ({ id, body }) => ({
        url: `/admin/contact-messages/${id}/reply`,
        method: 'POST',
        body: { body },
      }),
      transformResponse: (r: ApiSuccess<ContactMessage>) => r.data,
      invalidatesTags: [{ type: 'ContactMessage', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useSubmitInquiryMutation,
  useLogCallIntentMutation,
  useRequestCallbackMutation,
  useGetWhatsAppLinkQuery,
  useLazyGetWhatsAppLinkQuery,
  useSubmitContactGeneralMutation,
  useListContactMessagesQuery,
  useUpdateContactMessageMutation,
  useReplyToContactMessageMutation,
} = contactApi;
