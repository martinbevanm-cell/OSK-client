'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginDto } from '@contracts';
import { Button, TextField } from '@/components/ui';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { GoogleSignInButton } from '@/features/googleAuth';
import { SignupCaptcha, useGetCaptchaConfigQuery } from '@/features/captcha';
import { useLoginMutation, useResendVerificationPublicMutation } from '../authApi';
import { AuthErrorBanner } from './AuthErrorBanner';
import { getAuthErrorMessage, isEmailNotVerifiedError } from './authErrorMessage';
import styles from './AuthForm.module.scss';

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const [login, loginState] = useLoginMutation();
  const [resendVerification, resendState] = useResendVerificationPublicMutation();
  const { isLoading, error: serverError } = loginState;
  /* Two flavours of error: EMAIL_NOT_VERIFIED gets its own panel with
   * a Resend button; everything else uses the regular banner. */
  const needsVerification = isEmailNotVerifiedError(serverError);
  const errorMessage =
    serverError && !needsVerification ? getAuthErrorMessage(serverError) : null;
  /* Captcha state — mirrors signup. `captchaRequired` is derived
   * from the public config so this form is a no-op when captcha is
   * disabled. */
  const { data: captchaConfig } = useGetCaptchaConfigQuery();
  const captchaRequired = Boolean(
    captchaConfig?.enabled && captchaConfig.provider !== 'none',
  );
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaMissing, setCaptchaMissing] = useState(false);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (captchaRequired && !captchaToken) {
      setCaptchaMissing(true);
      return;
    }
    setCaptchaMissing(false);
    try {
      await login({
        ...values,
        captchaToken: captchaRequired ? captchaToken : undefined,
      }).unwrap();
      dispatch(toastPushed('success', 'Welcome back.'));
      router.push(searchParams.get('next') || '/dashboard');
    } catch {
      /* surfaced inline via `errorMessage` / `needsVerification` below.
       * Reset the captcha — both Turnstile tokens and local-captcha
       * challenges are single-use, so the next submit needs a fresh
       * one. */
      setCaptchaToken('');
      setCaptchaResetKey((n) => n + 1);
    }
  });

  const onResend = async () => {
    const email = getValues('email').trim();
    if (!email) return;
    try {
      await resendVerification({ email }).unwrap();
      dispatch(
        toastPushed(
          'success',
          'Verification link sent. Check your inbox (and spam folder).',
        ),
      );
    } catch {
      /* surfaced by the global toast */
    }
  };

  /* Surface OAuth callback failures (state mismatch, Google rejected
   * scope, etc.) so the user isn't dropped onto a blank sign-in page
   * with no explanation. */
  const oauthError = searchParams.get('oauthError');
  const oauthMessage = oauthErrorMessage(oauthError);

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <GoogleSignInButton redirectTo={searchParams.get('next') || undefined} />
      {oauthMessage ? <AuthErrorBanner message={oauthMessage} /> : null}
      {errorMessage ? <AuthErrorBanner message={errorMessage} /> : null}
      {needsVerification ? (
        <div className={styles.verifyPanel} role="alert">
          <p className={styles.verifyTitle}>Verify your email to continue</p>
          <p className={styles.verifyBody}>
            We sent a verification link to <strong>{getValues('email')}</strong>. Click it
            from your inbox, then come back and sign in. Didn&rsquo;t get it? Check the
            spam folder or send a fresh link.
          </p>
          <Button type="button" onClick={onResend} disabled={resendState.isLoading}>
            {resendState.isLoading ? 'Sending…' : 'Resend verification link'}
          </Button>
        </div>
      ) : null}

      <span className={styles.divider}>or continue with email</span>

      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <TextField
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Link href="/forgot-password" className={styles.inlineLink}>
        Forgot password?
      </Link>
      {captchaRequired ? (
        <SignupCaptcha
          resetKey={captchaResetKey}
          onToken={(token) => {
            setCaptchaToken(token);
            if (token) setCaptchaMissing(false);
          }}
        />
      ) : null}
      {captchaMissing ? (
        <AuthErrorBanner message="Please complete the captcha to continue." />
      ) : null}
      <Button
        type="submit"
        fullWidth
        disabled={isLoading || (captchaRequired && !captchaToken)}
      >
        {isLoading ? 'Signing in…' : 'Sign in'}
      </Button>
      <p className={styles.alt}>
        New here? <Link href="/sign-up">Create an account</Link>
      </p>
    </form>
  );
}

/* Map the backend's machine codes to friendly messages. Anything not
 * listed falls back to a generic "try again" string so we never crash
 * on a new reason code we haven't surfaced yet. */
function oauthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case 'state_mismatch':
    case 'state_missing':
    case 'state_invalid':
      return 'Your sign-in attempt expired. Please try again.';
    case 'token_exchange_failed':
    case 'id_token_invalid':
      return 'We couldn’t verify your Google sign-in. Please try again.';
    case 'google_disabled':
      return 'Google sign-in is currently disabled on this site.';
    case 'access_denied':
      return 'You declined the Google sign-in. No problem — you can use email instead.';
    case 'missing_code':
      return 'Google didn’t return a sign-in code. Please try again.';
    default:
      return 'Something went wrong with Google sign-in. Please try again.';
  }
}
