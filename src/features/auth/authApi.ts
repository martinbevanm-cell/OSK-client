import { baseApi } from '@/store/api/baseApi';
import type {
  ApiSuccess,
  AuthResult,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from '@contracts';
import { credentialsReceived, loggedOut } from './authSlice';

interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

/** Auth server state — injected into the shared baseApi. */
export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<AuthResult, LoginDto>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<AuthResult>) => r.data,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(credentialsReceived(data));
      },
    }),

    register: build.mutation<AuthResult, RegisterDto>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<AuthResult>) => r.data,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(credentialsReceived(data));
      },
    }),

    logout: build.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(loggedOut());
          dispatch(baseApi.util.resetApiState());
        }
      },
    }),

    /** Restores the session on app boot using the refresh cookie. */
    session: build.query<AuthResult, void>({
      query: () => '/auth/session',
      transformResponse: (r: ApiSuccess<AuthResult>) => r.data,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(credentialsReceived(data));
        } catch {
          /* not signed in — leave auth state idle */
        }
      },
    }),

    forgotPassword: build.mutation<{ sent: boolean }, ForgotPasswordDto>({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<{ sent: boolean }>) => r.data,
    }),

    resetPassword: build.mutation<{ reset: boolean }, ResetPasswordDto>({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<{ reset: boolean }>) => r.data,
    }),

    verifyEmail: build.mutation<{ verified: boolean }, { token: string }>({
      query: (body) => ({ url: '/auth/verify-email', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<{ verified: boolean }>) => r.data,
      /* On success, force the session query to re-run so the auth
       * slice picks up the new `emailVerified: true` flag — otherwise
       * the dashboard's "verify your email" banner stays visible
       * until the next page navigation. */
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(authApi.endpoints.session.initiate(undefined, { forceRefetch: true }));
        } catch {
          /* surfaced by the caller */
        }
      },
    }),

    /** Change password while signed in — server rotates the refresh family
     * and returns a fresh AuthResult so the caller's tab stays signed in. */
    changePassword: build.mutation<AuthResult, ChangePasswordBody>({
      query: (body) => ({
        url: '/auth/change-password',
        method: 'POST',
        body,
      }),
      transformResponse: (r: ApiSuccess<AuthResult>) => r.data,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(credentialsReceived(data));
      },
    }),

    /** Re-issue an email-verification token for the signed-in user. */
    resendVerification: build.mutation<{ sent: true; alreadyVerified: boolean }, void>({
      query: () => ({ url: '/auth/resend-verification', method: 'POST' }),
      transformResponse: (r: ApiSuccess<{ sent: true; alreadyVerified: boolean }>) =>
        r.data,
    }),

    /** Unauthenticated counterpart — used when a login attempt was
     *  bounced with EMAIL_NOT_VERIFIED and the user wants a fresh link
     *  without first establishing a session. Always resolves (no
     *  enumeration). */
    resendVerificationPublic: build.mutation<{ sent: true }, { email: string }>({
      query: (body) => ({
        url: '/auth/resend-verification-public',
        method: 'POST',
        body,
      }),
      transformResponse: (r: ApiSuccess<{ sent: true }>) => r.data,
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useSessionQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
  useChangePasswordMutation,
  useResendVerificationMutation,
  useResendVerificationPublicMutation,
} = authApi;
