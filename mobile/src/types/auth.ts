export interface User {
  id: number;
  email: string;
  role: 'user' | 'admin';
  onboardingComplete: boolean;
}

export interface LoginSuccess {
  token: string;
  user: User;
}

export interface SuspensionNotice {
  reason: string;
  until: string | null;
}
