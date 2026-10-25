import { z } from 'zod';

const email = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email({ error: 'Enter a valid email address' }));

// bcrypt only uses the first 72 bytes, so cap the length there
export const password = z
  .string({ error: 'Password is required' })
  .min(8, { error: 'Password must be at least 8 characters' })
  .max(72, { error: 'Password must be at most 72 characters' })
  .regex(/[A-Za-z]/, { error: 'Password must contain a letter' })
  .regex(/[0-9]/, { error: 'Password must contain a number' });

const optionalText = max =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform(v => v || undefined);

export const registerSchema = z.object({
  name: z.string({ error: 'Name is required' }).trim().min(2, { error: 'Name is too short' }).max(80),
  email,
  password,
  phone: optionalText(20).refine(v => !v || /^\+?[0-9\s-]{7,20}$/.test(v), { error: 'Enter a valid phone number' }),
  referralCode: optionalText(32).transform(v => v?.toUpperCase()),
});

export const loginSchema = z.object({
  email,
  // Don't leak password rules on login, just require something
  password: z.string({ error: 'Password is required' }).min(1, { error: 'Password is required' }).max(128),
});

export const googleSchema = z.object({
  idToken: z.string({ error: 'Google ID token is required' }).min(20).max(4096),
});

export const refreshSchema = z.object({
  refreshToken: z.string({ error: 'Refresh token is required' }).min(20).max(512),
});
