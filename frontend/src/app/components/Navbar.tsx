import { MessageSquare, Bell, User, Menu, X, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/app/context/AuthContext';
import apiClient from '@/app/lib/api';
import { useNotifications } from '@/app/hooks/useNotifications';
import { NotificationPanel } from '@/app/components/NotificationPanel';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';

const PRESENCE_PING_INTERVAL_MS = 60_000;

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useAuth();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

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
                <Popover open={notifOpen} onOpenChange={setNotifOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className={`${navIconClass(false)} relative`}
                      aria-label="Open notifications"
                      title="Notifications"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span
                          className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
                          aria-label={`${unreadCount} unread notifications`}
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    sideOffset={8}
                    className="p-0 w-auto bg-[#1e1b4b] border-white/10 text-white"
                  >
                    <NotificationPanel
                      notifications={notifications}
                      loading={loading}
                      unreadCount={unreadCount}
                      onMarkAsRead={markAsRead}
                      onMarkAllAsRead={markAllAsRead}
                      onDismiss={() => setNotifOpen(false)}
                    />
                  </PopoverContent>
                </Popover>
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
          <button
            className="lg:hidden text-white hover:text-purple-300 transition-colors ml-2"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      {/* Mobile Drawer */}
      {mobileOpen && isAuthenticated && (
        <div className="lg:hidden fixed top-20 left-0 right-0 z-40 bg-[#2E1065]/95 backdrop-blur-md border-b border-white/10 text-white">
          <div className="flex flex-col px-4 py-4 gap-1">
            <button onClick={() => navigate('/discover')} className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isDiscovery ? 'bg-white/10 text-purple-300' : 'hover:bg-white/10'}`}>Discover Athletes</button>
            <button onClick={() => navigate('/matches')}  className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isMatches  ? 'bg-white/10 text-purple-300' : 'hover:bg-white/10'}`}>Matches</button>
            <button onClick={() => navigate('/messages')} className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isMessages ? 'bg-white/10 text-purple-300' : 'hover:bg-white/10'}`}>Messages</button>
            {isAdmin && (
              <button onClick={() => navigate('/admin/home')} className="text-left px-4 py-3 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">Admin</button>
            )}
            <div className="border-t border-white/10 mt-2 pt-2 flex flex-col gap-1">
              <button onClick={() => navigate('/profile')}  className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isProfile   ? 'bg-white/10 text-purple-300' : 'hover:bg-white/10'}`}>Profile</button>
              <button onClick={() => navigate('/settings')} className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isSettings  ? 'bg-white/10 text-purple-300' : 'hover:bg-white/10'}`}>Settings</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
