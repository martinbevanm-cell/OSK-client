'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { REGISTRABLE_ROLES, registerSchema, type RegisterDto } from '@contracts';
import { Button, TextField } from '@/components/ui';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { useRegisterMutation } from '../authApi';
import { AuthErrorBanner } from './AuthErrorBanner';
import { getAuthErrorMessage } from './authErrorMessage';
import styles from './AuthForm.module.scss';

const ROLE_LABELS: Record<(typeof REGISTRABLE_ROLES)[number], string> = {
  buyer: 'Buyer — looking for a property',
  seller: 'Seller — listing my property',
  agent: 'Agent — managing listings & leads',
};

export function SignUpForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [registerUser, registerState] = useRegisterMutation();
  const { isLoading, error: serverError } = registerState;
  const errorMessage = getAuthErrorMessage(serverError);

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
    try {
      await registerUser(values).unwrap();
      dispatch(toastPushed('success', 'Account created — welcome to OSK.'));
      router.push('/dashboard');
    } catch {
      /* surfaced inline via `errorMessage` below */
    }
  });

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {errorMessage ? <AuthErrorBanner message={errorMessage} /> : null}

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
      <Button type="submit" fullWidth disabled={isLoading}>
        {isLoading ? 'Creating account…' : 'Create account'}
      </Button>
      <p className={styles.alt}>
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </p>
    </form>
  );
}
