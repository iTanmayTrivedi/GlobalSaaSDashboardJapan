import { toast } from 'sonner';

/**
 * Centralized API error handler.
 * Normalizes Supabase, fetch, and generic errors into user-friendly messages.
 */
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

const ERROR_MAP: Record<string, string> = {
  '23505': 'This record already exists.',
  '23503': 'Referenced record not found.',
  '42501': 'You do not have permission to perform this action.',
  'PGRST301': 'You must be logged in to perform this action.',
  'invalid_credentials': 'Invalid email or password.',
  'user_already_exists': 'An account with this email already exists.',
  'email_not_confirmed': 'Please verify your email before signing in.',
};

export function parseApiError(error: unknown): ApiError {
  if (!error) return { message: 'An unknown error occurred.' };

  // Supabase error shape
  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, any>;
    const code = e.code || e.error_code || '';
    const msg = e.message || e.error_description || e.msg || '';
    const status = e.status || e.statusCode;

    return {
      message: ERROR_MAP[code] || msg || 'Something went wrong.',
      code,
      status,
    };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  return { message: 'An unexpected error occurred.' };
}

/**
 * Handle an API error: parse and show a toast.
 * Returns the parsed error for further handling if needed.
 */
export function handleApiError(error: unknown, fallbackMessage?: string): ApiError {
  const parsed = parseApiError(error);
  toast.error(fallbackMessage || parsed.message);
  return parsed;
}
