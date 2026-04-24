import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { api, withToken } from '../api/client';
import { DEMO_MODE } from '../config/demo';
import { demoLogin, demoRegister } from '../demo/demoApi';
import { clearSession, persistSession, persistSuspension, persistUser, readSession } from '../storage/session';
import { LoginSuccess, SuspensionNotice, User } from '../types/auth';

interface AuthContextValue {
  token: string | null;
  user: User | null;
  suspendedNotice: SuspensionNotice | null;
  loading: boolean;
  error: string;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  clearSuspension: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [suspendedNotice, setSuspendedNotice] = useState<SuspensionNotice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const session = await readSession();
      setToken(session.token);
      setUser(session.user);
      setSuspendedNotice(session.suspensionNotice);
      withToken(session.token);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!token || DEMO_MODE) return;

    async function pingPresence() {
      try {
        await api.get('/api/auth/presence/ping');
      } catch {
        // Presence is best-effort; normal API calls still refresh last_active.
      }
    }

    void pingPresence();
    const timer = setInterval(() => void pingPresence(), 60000);
    return () => clearInterval(timer);
  }, [token]);

  async function login(email: string, password: string) {
    setError('');
    if (DEMO_MODE) {
      const data = await demoLogin(email);
      setToken(data.token);
      setUser(data.user);
      setSuspendedNotice(null);
      withToken(data.token);
      await persistSession(data.token, data.user);
      return;
    }
    try {
      const { data } = await api.post<LoginSuccess>('/api/auth/login', { email, password });
      setToken(data.token);
      setUser(data.user);
      setSuspendedNotice(null);
      withToken(data.token);
      await persistSession(data.token, data.user);
    } catch (e) {
      const err = e as AxiosError<any>;
      const status = err.response?.status;
      const payload = err.response?.data || {};

      if (status === 403 && payload.reason === 'suspended') {
        const notice: SuspensionNotice = {
          reason: payload.suspensionReason || 'Your account is temporarily suspended.',
          until: payload.until ?? null,
        };
        setToken(null);
        setUser(null);
        setSuspendedNotice(notice);
        withToken(null);
        await persistSuspension(notice);
        return;
      }

      if (status === 403 && payload.reason === 'banned') {
        setError(payload.error || 'This account has been permanently disabled for violating our terms.');
        return;
      }

      setError(payload.error || 'Login failed. Please try again.');
    }
  }

  async function register(email: string, password: string): Promise<string | null> {
    if (DEMO_MODE) {
      const data = await demoRegister(email);
      setToken(data.token);
      setUser(data.user);
      setSuspendedNotice(null);
      withToken(data.token);
      await persistSession(data.token, data.user);
      return null;
    }
    try {
      const { data } = await api.post<LoginSuccess>('/api/auth/signup', { email, password });
      setToken(data.token);
      setUser(data.user);
      setSuspendedNotice(null);
      withToken(data.token);
      await persistSession(data.token, data.user);
      return null;
    } catch (e) {
      const err = e as AxiosError<any>;
      return err.response?.data?.error || 'Registration failed. Please try again.';
    }
  }

  async function logout() {
    setToken(null);
    setUser(null);
    setSuspendedNotice(null);
    setError('');
    withToken(null);
    await clearSession();
  }

  async function clearSuspension() {
    setSuspendedNotice(null);
    await clearSession();
  }

  async function completeOnboarding() {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      onboardingComplete: true,
    };
    setUser(updatedUser);
    await persistUser(updatedUser);
  }

  const value = useMemo(
    () => ({ token, user, suspendedNotice, loading, error, login, register, logout, clearSuspension, completeOnboarding }),
    [token, user, suspendedNotice, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
