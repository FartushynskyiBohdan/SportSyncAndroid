import { Outlet, Link, Navigate, useLocation } from 'react-router';
import { Home, Users, FileText, LogOut } from 'lucide-react';
import { clearAuthData, getAuthToken, isAdmin } from '../../lib/auth';

export function AdminLayout() {
  const token = getAuthToken();
  const location = useLocation();

  if (!token || !isAdmin()) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    clearAuthData();
    window.location.href = '/login';
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-white/10 bg-slate-900/95 p-6">
          <div className="mb-10">
            <div className="text-3xl font-black tracking-tight">Admin</div>
            <p className="mt-2 text-sm text-slate-400">Manage SportSync operations and moderation.</p>
          </div>

          <nav className="space-y-2">
            <Link
              to="home"
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                location.pathname.endsWith('/home') ? 'bg-purple-500/20 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Home className="w-5 h-5" />
              Dashboard
            </Link>
            <Link
              to="users"
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                location.pathname.endsWith('/users') ? 'bg-purple-500/20 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              Users
            </Link>
            <Link
              to="reports"
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                location.pathname.endsWith('/reports') ? 'bg-purple-500/20 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <FileText className="w-5 h-5" />
              Reports
            </Link>
          </nav>

          <div className="mt-12 border-t border-white/10 pt-6">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/10"
            >
              <span>Sign out</span>
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </aside>

        <main className="bg-slate-950 px-6 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
