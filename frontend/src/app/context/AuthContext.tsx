import { createContext, useContext, useState, type ReactNode } from 'react';

export type UserRole = 'user' | 'admin';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  onboardingComplete: boolean;
}

interface AuthContextValue {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, user: User, rememberMe?: boolean) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStorage(): { token: string | null; user: User | null } {
  const token = localStorage.getItem('token') ?? sessionStorage.getItem('token');
  const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user');
  const user: User | null = raw ? JSON.parse(raw) : null;
  return { token, user };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = readStorage();
  const [token, setToken] = useState<string | null>(initial.token);
  const [user, setUser] = useState<User | null>(initial.user);

  function login(newToken: string, newUser: User, rememberMe = true) {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('token', newToken);
    storage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }

  function updateUser(newUser: User) {
    // Update whichever storage currently holds the user
    if (localStorage.getItem('token')) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      sessionStorage.setItem('user', JSON.stringify(newUser));
    }
    setUser(newUser);
  }

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, isAdmin: user?.role === 'admin', login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
