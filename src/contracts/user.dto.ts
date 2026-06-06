import { z } from 'zod';
import type { UserRole } from './enums';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'blocked';
  emailVerified: boolean;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  companyName?: string;
  companyRegistration?: string;
  createdAt: string;
  updatedAt: string;
}

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(80).optional(),
  avatarUrl: z.string().url('Enter a valid URL').max(500).optional().or(z.literal('')),
  phone: z.string().min(6, 'Phone is too short').max(40).optional().or(z.literal('')),
  address: z
    .string()
    .min(3, 'Address is too short')
    .max(240)
    .optional()
    .or(z.literal('')),
  city: z.string().min(2, 'City is too short').max(80).optional().or(z.literal('')),
  state: z.string().min(2, 'State is too short').max(80).optional().or(z.literal('')),
  country: z.string().min(2, 'Country is too short').max(80).optional().or(z.literal('')),
  companyName: z
    .string()
    .min(2, 'Company name is too short')
    .max(120)
    .optional()
    .or(z.literal('')),
  companyRegistration: z
    .string()
    .min(2, 'Company registration is too short')
    .max(120)
    .optional()
    .or(z.literal('')),
});
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
