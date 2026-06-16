import { baseApi } from '@/store/api/baseApi';
import type {
  ApiSuccess,
  EmailPreview,
  EmailPreviewType,
  EmailSettings,
  EmailTemplateKey,
  SendTestEmailDto,
  UpdateEmailSettingsDto,
} from '@contracts';

/**
 * Admin email-settings server state.
 *
 *  - getEmailSettings   → masked credentials + readiness flag
 *  - updateEmailSettings → partial PATCH; encrypts secrets server-side
 *  - sendTestEmail      → fires a one-shot test using the current config
 */
export const emailApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getEmailSettings: build.query<EmailSettings, void>({
      query: () => '/admin/email',
      transformResponse: (r: ApiSuccess<EmailSettings>) => r.data,
      providesTags: [{ type: 'EmailSettings', id: 'DEFAULT' }],
    }),

    updateEmailSettings: build.mutation<EmailSettings, UpdateEmailSettingsDto>({
      query: (body) => ({ url: '/admin/email', method: 'PATCH', body }),
      transformResponse: (r: ApiSuccess<EmailSettings>) => r.data,
      invalidatesTags: [{ type: 'EmailSettings', id: 'DEFAULT' }],
    }),

    sendTestEmail: build.mutation<{ sent: boolean; to: string }, SendTestEmailDto>({
      query: (body) => ({
        url: '/admin/email/test',
        method: 'POST',
        body,
      }),
      transformResponse: (r: ApiSuccess<{ sent: boolean; to: string }>) => r.data,
    }),

    /**
     * Sample preview render — pass a (template, type) pair and the
     * backend returns the exact subject + HTML the seller would
     * receive with that combo. Used to power the preview iframe in
     * the admin email manager.
     */
    previewEmail: build.query<
      EmailPreview,
      { template: EmailTemplateKey; type: EmailPreviewType }
    >({
      query: ({ template, type }) => ({
        url: '/admin/email/preview',
        params: { template, type },
      }),
      transformResponse: (r: ApiSuccess<EmailPreview>) => r.data,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetEmailSettingsQuery,
  usePreviewEmailQuery,
  useUpdateEmailSettingsMutation,
  useSendTestEmailMutation,
} = emailApi;
