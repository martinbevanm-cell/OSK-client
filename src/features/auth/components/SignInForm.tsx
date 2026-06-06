'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginDto } from '@contracts';
import { Button, TextField } from '@/components/ui';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { useLoginMutation } from '../authApi';
import { AuthErrorBanner } from './AuthErrorBanner';
import { getAuthErrorMessage } from './authErrorMessage';
import styles from './AuthForm.module.scss';

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const [login, loginState] = useLoginMutation();
  const { isLoading, error: serverError } = loginState;
  const errorMessage = getAuthErrorMessage(serverError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values).unwrap();
      dispatch(toastPushed('success', 'Welcome back.'));
      router.push(searchParams.get('next') || '/dashboard');
    } catch {
      /* surfaced inline via `errorMessage` below */
    }
  });

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
      <Button type="submit" fullWidth disabled={isLoading}>
        {isLoading ? 'Signing in…' : 'Sign in'}
      </Button>
      <p className={styles.alt}>
        New to OSK? <Link href="/sign-up">Create an account</Link>
      </p>
    </form>
  );
}
