import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/app/context/AuthContext';

/** Requires authentication only (used for onboarding pages). */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

/** Requires authentication AND completed onboarding (used for main app pages). */
export function AppRoute() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.onboardingComplete) {
    return <Navigate to="/onboarding/profile" replace />;
  }

  return <Outlet />;
}
