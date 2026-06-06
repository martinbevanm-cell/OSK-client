import { baseApi } from '@/store/api/baseApi';
import type {
  ApiSuccess,
  CallbackRequestDto,
  CallIntentDto,
  Inquiry,
  InquiryDto,
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
  }),
  overrideExisting: false,
});

export const {
  useSubmitInquiryMutation,
  useLogCallIntentMutation,
  useRequestCallbackMutation,
  useGetWhatsAppLinkQuery,
  useLazyGetWhatsAppLinkQuery,
} = contactApi;
