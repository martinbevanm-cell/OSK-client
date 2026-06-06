'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordDto } from '@contracts';
import { Button, TextField } from '@/components/ui';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { useResetPasswordMutation } from '../authApi';
import { AuthErrorBanner } from './AuthErrorBanner';
import { getAuthErrorMessage } from './authErrorMessage';
import styles from './AuthForm.module.scss';

export function ResetPasswordForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token = useSearchParams().get('token') ?? '';
  const [resetPassword, resetState] = useResetPasswordMutation();
  const { isLoading, error: serverError } = resetState;
  const errorMessage = getAuthErrorMessage(serverError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordDto>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await resetPassword(values).unwrap();
      dispatch(toastPushed('success', 'Password updated — please sign in.'));
      router.push('/sign-in');
    } catch {
      /* surfaced inline via `errorMessage` below */
    }
  });

  if (!token) {
    return (
      <div className={styles.status}>
        <p className={styles.statusError}>
          This reset link is missing or malformed.
        </p>
        <Link href="/forgot-password">
          <Button variant="secondary">Request a new link</Button>
        </Link>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {errorMessage ? <AuthErrorBanner message={errorMessage} /> : null}
      <input type="hidden" {...register('token')} />
      <TextField
        label="New password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <TextField
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <Button type="submit" fullWidth disabled={isLoading}>
        {isLoading ? 'Updating…' : 'Update password'}
      </Button>
      <p className={styles.alt}>
        <Link href="/sign-in">Back to sign in</Link>
      </p>
    </form>
  );
}
