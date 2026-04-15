import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useEffect, useState } from 'react';
import { getUserRole, isLoggedIn } from './lib/auth';

export default function App() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Redirect admins to admin dashboard on app load
    if (isLoggedIn() && getUserRole() === 'admin' && window.location.pathname !== '/admin/home') {
      setIsRedirecting(true);
      window.location.href = '/admin/home';
    }
  }, []);

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-lg">Redirecting to admin dashboard...</div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}
