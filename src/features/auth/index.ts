/** Public surface of the auth feature. Import auth ONLY from here. */
export {
  authReducer,
  credentialsReceived,
  credentialsRefreshed,
  impersonationStarted,
  impersonationStopped,
  loggedOut,
  selectCurrentUser,
  selectIsAuthenticated,
  selectUserRole,
  selectIsImpersonating,
  selectImpersonatingAdmin,
} from './authSlice';
export {
  authApi,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useSessionQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
  useChangePasswordMutation,
  useResendVerificationMutation,
} from './authApi';
export { SignInForm } from './components/SignInForm';
export { SignUpForm } from './components/SignUpForm';
export { ForgotPasswordForm } from './components/ForgotPasswordForm';
export { ResetPasswordForm } from './components/ResetPasswordForm';
export { VerifyEmail } from './components/VerifyEmail';
export { RequireAuth } from './components/RequireAuth';
export { AuthBootstrap } from './components/AuthBootstrap';
export { HeaderAuth } from './components/HeaderAuth';
export { ImpersonationBanner } from './components/ImpersonationBanner';
