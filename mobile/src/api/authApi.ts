import { api } from './client';
import { DEMO_MODE } from '../config/demo';

const GENERIC_RESET_MESSAGE = 'If an account with that email exists, a reset link has been sent.';

export async function requestPasswordReset(email: string) {
  if (DEMO_MODE) {
    return { message: GENERIC_RESET_MESSAGE };
  }

  const { data } = await api.post<{ message: string }>('/api/auth/forgot-password', { email });
  return data;
}

export async function resetPassword(token: string, password: string) {
  if (DEMO_MODE) {
    return { message: 'Password has been reset successfully.' };
  }

  const { data } = await api.post<{ message: string }>('/api/auth/reset-password', {
    token,
    password,
  });
  return data;
}
