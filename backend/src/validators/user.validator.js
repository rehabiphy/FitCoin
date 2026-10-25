import { z } from 'zod';
import { password } from './auth.validator.js';

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, { error: 'Name is too short' }).max(80).optional(),
    phone: z
      .string()
      .trim()
      .max(20)
      .refine(v => v === '' || /^\+?[0-9\s-]{7,20}$/.test(v), { error: 'Enter a valid phone number' })
      .optional(),
    avatar: z.url({ error: 'Avatar must be a URL' }).max(2048).optional(),
  })
  .refine(data => Object.keys(data).length > 0, { error: 'Nothing to update' });

export const changePasswordSchema = z.object({
  currentPassword: z.string().max(128).optional(),
  newPassword: password,
});
