import { baseApi } from '@/store/api/baseApi';
import type {
  ApiSuccess,
  GoogleAuthPublicConfig,
  GoogleAuthSettingsDTO,
  UpdateGoogleAuthSettingsDto,
} from '@contracts';

/**
 * Google OAuth server state.
 *
 *  - getGoogleAuthConfig    → public; signup/sign-in forms use this
 *                             to decide whether to render the
 *                             "Continue with Google" button
 *  - getGoogleAuthSettings  → admin-only; masked secret + readiness
 *  - updateGoogleAuthSettings → admin-only; partial PATCH
 */
export const googleAuthApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getGoogleAuthConfig: build.query<GoogleAuthPublicConfig, void>({
      query: () => '/auth/google/config',
      transformResponse: (r: ApiSuccess<GoogleAuthPublicConfig>) => r.data,
      providesTags: [{ type: 'GoogleAuthSettings', id: 'PUBLIC' }],
    }),

    getGoogleAuthSettings: build.query<GoogleAuthSettingsDTO, void>({
      query: () => '/admin/auth/google',
      transformResponse: (r: ApiSuccess<GoogleAuthSettingsDTO>) => r.data,
      providesTags: [{ type: 'GoogleAuthSettings', id: 'ADMIN' }],
    }),

    updateGoogleAuthSettings: build.mutation<
      GoogleAuthSettingsDTO,
      UpdateGoogleAuthSettingsDto
    >({
      query: (body) => ({ url: '/admin/auth/google', method: 'PATCH', body }),
      transformResponse: (r: ApiSuccess<GoogleAuthSettingsDTO>) => r.data,
      invalidatesTags: [
        { type: 'GoogleAuthSettings', id: 'ADMIN' },
        { type: 'GoogleAuthSettings', id: 'PUBLIC' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetGoogleAuthConfigQuery,
  useGetGoogleAuthSettingsQuery,
  useUpdateGoogleAuthSettingsMutation,
} = googleAuthApi;
