import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import apiClient from '@/app/lib/api';
import { useAuth } from '@/app/context/AuthContext';

export type NotificationType = 'new_match' | 'new_message' | 'admin_warning';

export interface NotificationPeer {
  id: number;
  name: string | null;
  photoUrl: string | null;
}

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
  matchId: number | null;
  messageId: number | null;
  complaintId: number | null;
  peer: NotificationPeer | null;
}

function readToken(): string | null {
  return localStorage.getItem('token') ?? sessionStorage.getItem('token');
}

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const unreadCount = useMemo(
    () => notifications.reduce((acc, n) => acc + (n.isRead ? 0 : 1), 0),
    [notifications]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    apiClient
      .get<Notification[]>('/api/notifications')
      .then((res) => {
        if (!cancelled) setNotifications(res.data);
      })
      .catch(() => {
        // Silent — panel shows empty state on failure.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const token = readToken();
    if (!token) return;

    // EventSource cannot set Authorization headers; JWT rides as ?token.
    const source = new EventSource(
      `/api/notifications/stream?token=${encodeURIComponent(token)}`
    );
    eventSourceRef.current = source;

    source.addEventListener('notification', (evt) => {
      try {
        const payload = JSON.parse((evt as MessageEvent).data) as Notification;
        setNotifications((prev) => {
          if (prev.some((n) => n.id === payload.id)) return prev;
          return [payload, ...prev].slice(0, 50);
        });
      } catch {
        // Ignore malformed payloads.
      }
    });

    source.onerror = () => {
      // Browser auto-reconnects. No-op here.
    };

    return () => {
      cancelled = true;
      source.close();
      eventSourceRef.current = null;
    };
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await apiClient.patch(`/api/notifications/${id}/read`);
    } catch {
      // Best-effort — leave optimistic update in place.
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await apiClient.patch('/api/notifications/read-all');
    } catch {
      // Best-effort.
    }
  }, []);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}
