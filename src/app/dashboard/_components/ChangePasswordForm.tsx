'use client';

import { useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  changePasswordSchema,
  type ChangePasswordDto,
} from '@contracts';
import { useChangePasswordMutation } from '@/features/auth';
import { getAuthErrorMessage } from '@/features/auth/components/authErrorMessage';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { Button, TextField } from '@/components/ui';
import styles from './ChangePasswordForm.module.scss';

export function ChangePasswordForm() {
  const dispatch = useAppDispatch();
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordDto>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: ChangePasswordDto) => {
    setServerError(null);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }).unwrap();
      dispatch(
        toastPushed(
          'success',
          'Password updated — every other device has been signed out.',
        ),
      );
      reset();
    } catch (err) {
      setServerError(getAuthErrorMessage(err) ?? 'Could not change password.');
    }
  };

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(onSubmit) as (e: FormEvent) => void}
      noValidate
    >
      <div className={styles.head}>
        <h2 className={styles.title}>Change password</h2>
        <p className={styles.sub}>
          Changing your password signs out every other device. This tab
          stays signed in with a fresh session.
        </p>
      </div>

      {serverError ? (
        <p className={styles.error} role="alert">
          {serverError}
        </p>
      ) : null}

      <TextField
        label="Current password"
        type="password"
        autoComplete="current-password"
        {...register('currentPassword')}
        error={errors.currentPassword?.message}
      />
      <div className={styles.grid}>
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          {...register('newPassword')}
          error={errors.newPassword?.message}
          hint="At least 8 characters, one uppercase, one number."
        />
        <TextField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />
      </div>

      <div className={styles.actions}>
        <Button type="submit" size="lg" disabled={isLoading}>
          {isLoading ? 'Updating…' : 'Update password'}
        </Button>
      </div>
    </form>
  );
}
