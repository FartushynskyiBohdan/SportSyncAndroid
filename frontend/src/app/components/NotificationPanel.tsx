import { Heart, MessageSquare, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { Notification } from '@/app/hooks/useNotifications';
import { cn } from '@/app/components/ui/utils';

interface NotificationPanelProps {
  notifications: Notification[];
  loading: boolean;
  unreadCount: number;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onDismiss?: () => void;
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const seconds = Math.max(1, Math.floor(diffMs / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationPanel({
  notifications,
  loading,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
}: NotificationPanelProps) {
  const navigate = useNavigate();

  const handleClick = (n: Notification) => {
    if (!n.isRead) onMarkAsRead(n.id);
    if (n.type === 'new_match') navigate('/matches');
    else if (n.type === 'new_message') navigate('/messages');
    if (onDismiss) onDismiss();
  };

  return (
    <div className="flex flex-col max-h-[420px] w-80">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white">Notifications</h3>
        <button
          type="button"
          onClick={onMarkAllAsRead}
          disabled={unreadCount === 0}
          className="text-xs text-purple-300 hover:text-purple-200 disabled:text-white/30 disabled:cursor-not-allowed transition-colors"
        >
          Mark all as read
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <p className="px-4 py-8 text-sm text-white/50 text-center">Loading…</p>
        ) : notifications.length === 0 ? (
          <p className="px-4 py-8 text-sm text-white/50 text-center">No notifications yet</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleClick(n)}
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5',
                    !n.isRead && 'bg-white/5',
                    n.type === 'admin_warning' && 'border-l-4 border-red-500'
                  )}
                >
                  <NotificationIcon notification={n} />

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm leading-snug',
                        n.type === 'admin_warning' ? 'text-red-200' : 'text-white'
                      )}
                    >
                      {n.type === 'new_match' && n.peer?.name ? (
                        <>
                          You matched with <span className="font-semibold">{n.peer.name}</span>
                        </>
                      ) : n.type === 'new_message' && n.peer?.name ? (
                        <>
                          <span className="font-semibold">{n.peer.name}</span> sent you a message
                        </>
                      ) : (
                        n.message
                      )}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">{formatRelative(n.createdAt)}</p>
                  </div>

                  {!n.isRead && (
                    <span
                      aria-hidden
                      className="mt-2 w-2 h-2 rounded-full bg-purple-400 shrink-0"
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function NotificationIcon({ notification }: { notification: Notification }) {
  if (notification.type === 'admin_warning') {
    return (
      <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
        <ShieldAlert className="w-5 h-5 text-red-400" />
      </div>
    );
  }

  const photoUrl = notification.peer?.photoUrl || null;

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={notification.peer?.name || ''}
        className="w-10 h-10 rounded-full object-cover shrink-0"
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
      {notification.type === 'new_match' ? (
        <Heart className="w-5 h-5 text-purple-300" />
      ) : (
        <MessageSquare className="w-5 h-5 text-purple-300" />
      )}
    </div>
  );
}
