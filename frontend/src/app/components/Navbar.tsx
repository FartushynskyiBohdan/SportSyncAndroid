import { Search, MessageSquare, Bell, User, Menu, Settings } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/app/context/AuthContext';
import apiClient from '@/app/lib/api';

const PRESENCE_PING_INTERVAL_MS = 60_000;

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useAuth();
  const isDiscovery = location.pathname === '/discover';
  const isPublicPage = location.pathname === '/' || location.pathname === '/login';
  const isMatches = location.pathname === '/matches';
  const isMessages = location.pathname === '/messages';
  const isProfile = location.pathname === '/profile';
  const isSettings = location.pathname.startsWith('/settings');
  const navLinkClass = (active: boolean) =>
    active
      ? 'text-purple-300'
      : 'hover:text-purple-300 transition-colors cursor-pointer';
  const navIconClass = (active: boolean) =>
    active
      ? 'text-purple-300'
      : 'hover:text-purple-300 transition-colors';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    const ping = async () => {
      if (cancelled) return;
      try {
        await apiClient.get('/api/auth/presence/ping');
      } catch {
        // Best-effort heartbeat.
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        ping();
      }
    };

    ping();
    const interval = window.setInterval(ping, PRESENCE_PING_INTERVAL_MS);
    window.addEventListener('focus', ping);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('focus', ping);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isAuthenticated]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#2E1065]/80 backdrop-blur-md border-b border-white/10 text-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 h-20 flex items-center gap-4 md:gap-8">
        {/* Logo - always left */}
        <div
          className="text-2xl font-bold tracking-tight shrink-0 cursor-pointer"
          onClick={() => navigate('/')}
        >
          SportSync
        </div>

        {/* Right-aligned group: on public pages only auth; otherwise search, nav, icons, (auth when not discovery) */}
        <div className="flex-1 flex items-center justify-end gap-4 md:gap-6">
          {/* Search, nav links, icons - only when authenticated */}
          {isAuthenticated && (
            <>
              {/* Search Bar - hidden on mobile and discover page */}
              {!isDiscovery && (
                <div className="w-48 md:w-64 lg:w-80 relative hidden md:block shrink-0">
                  <input
                    type="text"
                    placeholder="Advanced Search..."
                    className="w-full bg-white/10 border border-white/20 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-white/50 focus:outline-none focus:bg-white/20 transition-colors"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                </div>
              )}

              {/* Links */}
              <div className="hidden lg:flex items-center gap-6 text-sm font-medium">
                <button
                  onClick={() => navigate('/discover')}
                  className={navLinkClass(isDiscovery)}
                  aria-current={isDiscovery ? 'page' : undefined}
                >
                  Discover Athletes
                </button>
                <button
                  onClick={() => navigate('/matches')}
                  className={navLinkClass(isMatches)}
                  aria-current={isMatches ? 'page' : undefined}
                >
                  Matches
                </button>
                {isAdmin && (
                  <button onClick={() => navigate('/admin/home')} className="hover:text-purple-300 transition-colors cursor-pointer">
                    Admin
                  </button>
                )}
              </div>

              {/* Icons */}
              <div className="hidden lg:flex items-center gap-4 border-l border-white/20 pl-6">
                <button
                  onClick={() => navigate('/messages')}
                  className={navIconClass(isMessages)}
                  aria-label="Open messages"
                  aria-current={isMessages ? 'page' : undefined}
                  title="Messages"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                <button
                  className={navIconClass(false)}
                  aria-label="Open notifications"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className={navIconClass(isSettings)}
                  aria-label="Open settings"
                  aria-current={isSettings ? 'page' : undefined}
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className={navIconClass(isProfile)}
                  aria-label="Open profile"
                  aria-current={isProfile ? 'page' : undefined}
                  title="Profile"
                >
                  <User className="w-5 h-5" />
                </button>
              </div>
            </>
          )}

          {/* Auth Buttons - shown to anonymous visitors, hidden on the auth pages themselves */}
          {!isAuthenticated && !isAuthPage && (
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => navigate('/login')}
                className="text-sm font-medium hover:text-purple-300 transition-colors cursor-pointer px-2 py-1"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="bg-white text-purple-900 px-4 py-2 rounded-full text-sm font-bold hover:bg-purple-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                Register
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button className="lg:hidden text-white hover:text-purple-300 transition-colors ml-2">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  );
}
