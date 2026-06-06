'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordDto } from '@contracts';
import { Button, TextField } from '@/components/ui';
import { useForgotPasswordMutation } from '../authApi';
import { AuthErrorBanner } from './AuthErrorBanner';
import { getAuthErrorMessage } from './authErrorMessage';
import styles from './AuthForm.module.scss';

export function ForgotPasswordForm() {
  const [forgotPassword, forgotState] = useForgotPasswordMutation();
  const { isLoading, error: serverError } = forgotState;
  const errorMessage = getAuthErrorMessage(serverError);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordDto>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await forgotPassword(values).unwrap();
      // Response is intentionally the same whether or not the account exists.
      setSent(true);
    } catch {
      /* surfaced inline via `errorMessage` below */
    }
  });

  if (sent) {
    return (
      <div className={styles.form}>
        <p className={styles.notice}>
          If an account exists for that email, a password-reset link is on its
          way. The link expires in one hour.
        </p>
        <p className={styles.alt}>
          <Link href="/sign-in">Back to sign in</Link>
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {errorMessage ? <AuthErrorBanner message={errorMessage} /> : null}
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Button type="submit" fullWidth disabled={isLoading}>
        {isLoading ? 'Sending…' : 'Send reset link'}
      </Button>
      <p className={styles.alt}>
        Remembered it? <Link href="/sign-in">Sign in</Link>
      </p>
    </form>
  );
}
