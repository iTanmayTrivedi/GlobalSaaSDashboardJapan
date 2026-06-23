import { z } from 'zod';

/** Auth - Sign In */
export const signInSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

/** Auth - Sign Up */
export const signUpSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  displayName: z.string().trim().max(100, 'Display name too long').optional(),
  selectedRole: z.enum(['super_admin', 'org_admin', 'member']).default('member'),
});

/** Onboarding - Create Org */
export const createOrgSchema = z.object({
  orgName: z.string().trim().min(1, 'Organization name is required').max(100, 'Name too long'),
});

/** Settings - Profile */
export const profileSchema = z.object({
  displayName: z.string().trim().max(100, 'Display name too long'),
});

/** Settings - Organization */
export const orgSettingsSchema = z.object({
  orgName: z.string().trim().min(1, 'Organization name is required').max(100, 'Name too long'),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type CreateOrgInput = z.infer<typeof createOrgSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type OrgSettingsInput = z.infer<typeof orgSettingsSchema>;
