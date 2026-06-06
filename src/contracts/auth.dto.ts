import { z } from 'zod';
import { REGISTRABLE_ROLES, type UserRole } from './enums';

/** Login request. */
export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type LoginDto = z.infer<typeof loginSchema>;

/** Registration request. Admin role can never be self-registered. */
export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name is too short').max(80),
    email: z.string().email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string(),
    role: z.enum(REGISTRABLE_ROLES),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
export type RegisterDto = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

/** Change password while signed in. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'New passwords do not match',
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    path: ['newPassword'],
    message: 'New password must differ from the current one',
  });
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

/** The authenticated user as exposed to the client (no secrets). */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  avatarUrl?: string;
}

/**
 * Auth result. The refresh token is delivered as an httpOnly cookie and is
 * never visible to JS — the client only ever holds the access token in memory.
 */
export interface AuthResult {
  user: SessionUser;
  accessToken: string;
  accessTokenExpiresAt: string;
}
