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
  const { isAuthenticated, isAdmin, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin/home" replace />;
  }

  if (!user?.onboardingComplete) {
    return <Navigate to="/onboarding/profile" replace />;
  }

  return <Outlet />;
}

/** Requires authentication AND admin role (used for admin pages). */
export function AdminRoute() {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/discover" replace />;
  }

  return <Outlet />;
}
