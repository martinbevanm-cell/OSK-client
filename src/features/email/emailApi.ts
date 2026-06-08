import { baseApi } from '@/store/api/baseApi';
import type {
  ApiSuccess,
  EmailSettings,
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
  }),
  overrideExisting: false,
});

export const {
  useGetEmailSettingsQuery,
  useUpdateEmailSettingsMutation,
  useSendTestEmailMutation,
} = emailApi;
