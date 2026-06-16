'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { REGISTRABLE_ROLES, registerSchema, type RegisterDto } from '@contracts';
import { Button, TextField } from '@/components/ui';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { SignupCaptcha, useGetCaptchaConfigQuery } from '@/features/captcha';
import { GoogleSignInButton } from '@/features/googleAuth';
import { useRegisterMutation, useResendVerificationPublicMutation } from '../authApi';
import { AuthErrorBanner } from './AuthErrorBanner';
import { getAuthErrorMessage } from './authErrorMessage';
import styles from './AuthForm.module.scss';

const ROLE_LABELS: Record<(typeof REGISTRABLE_ROLES)[number], string> = {
  buyer: 'Buyer — looking for a property',
  seller: 'Seller — listing my property',
  agent: 'Agent — managing listings & leads',
};

export function SignUpForm() {
  const dispatch = useAppDispatch();
  const [registerUser, registerState] = useRegisterMutation();
  const [resendVerification, resendState] = useResendVerificationPublicMutation();
  const { isLoading, error: serverError } = registerState;
  const errorMessage = getAuthErrorMessage(serverError);
  /* Captcha state. `captchaRequired` is derived from the public
   * config — when false, the form behaves exactly as before. */
  const { data: captchaConfig } = useGetCaptchaConfigQuery();
  const captchaRequired = Boolean(
    captchaConfig?.enabled && captchaConfig.provider !== 'none' && captchaConfig.siteKey,
  );
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaMissing, setCaptchaMissing] = useState(false);
  /* Bumped after a failed submit so the LocalCaptcha widget fetches
   * a fresh challenge — local captcha tokens are single-use. */
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  /* After a successful register we stay on this page and show a
   * "Check your email" panel — we don't push the user to the dashboard
   * because they can't actually sign in until they verify. Holds the
   * email so we know who to resend the link to. */
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterDto>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'buyer',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (captchaRequired && !captchaToken) {
      setCaptchaMissing(true);
      return;
    }
    setCaptchaMissing(false);
    try {
      await registerUser({
        ...values,
        captchaToken: captchaRequired ? captchaToken : undefined,
      }).unwrap();
      /* Don't push to /dashboard — login is gated by email
       * verification, so the only correct next step is to check the
       * inbox for the verify link. */
      setRegisteredEmail(values.email.trim());
      dispatch(
        toastPushed(
          'success',
          'Account created — check your inbox for the verification link.',
        ),
      );
    } catch {
      /* surfaced inline via `errorMessage` below. Reset the captcha
       * because both Turnstile tokens and local-captcha challenges
       * are single-use — the next submit needs a fresh one. */
      setCaptchaToken('');
      setCaptchaResetKey((n) => n + 1);
    }
  });

  const onResend = async () => {
    if (!registeredEmail) return;
    try {
      await resendVerification({ email: registeredEmail }).unwrap();
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

  /* Post-register "check your inbox" view. Replaces the form entirely
   * so the user can't accidentally re-submit and so the screen reads
   * as a clean confirmation. */
  if (registeredEmail) {
    return (
      <div className={styles.form}>
        <div className={styles.successPanel} role="status">
          <p className={styles.successTitle}>Check your email</p>
          <p className={styles.successBody}>
            We sent a verification link to <strong>{registeredEmail}</strong>. Click it to
            activate your account, then come back and <Link href="/sign-in">sign in</Link>
            . The link expires in 24 hours.
          </p>
          <Button type="button" onClick={onResend} disabled={resendState.isLoading}>
            {resendState.isLoading ? 'Sending…' : 'Resend verification link'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <GoogleSignInButton variant="signup" />
      {errorMessage ? <AuthErrorBanner message={errorMessage} /> : null}

      <span className={styles.divider}>or sign up with email</span>

      <TextField
        label="Full name"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <div className={styles.row}>
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          hint="At least 8 characters with an uppercase letter and a number."
          {...register('password')}
        />
        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      </div>
      <div className={styles.selectField}>
        <label className={styles.label} htmlFor="signup-role">
          I am a
        </label>
        <select id="signup-role" className={styles.select} {...register('role')}>
          {REGISTRABLE_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </div>
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
        {isLoading ? 'Creating account…' : 'Create account'}
      </Button>
      <p className={styles.alt}>
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </p>
    </form>
  );
}
