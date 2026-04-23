import { useCallback, useEffect, useState } from 'react';
import { Ban, Loader2, User } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { SettingsPanel, SettingsShell } from '../components/settings/SettingsShell';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '../components/ui/alert-dialog';
import apiClient from '../lib/api';

/* ─── Types ─── */

interface BlockedUser {
  userId: number;
  name: string;
  city: string;
  country: string;
  photo: string | null;
  blockedAt: string;
}

/* ─── Page ─── */

export function BlockedUsers() {
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /* Unblock confirmation state */
  const [unblockTarget, setUnblockTarget] = useState<BlockedUser | null>(null);
  const [unblocking, setUnblocking] = useState(false);

  const fetchBlocked = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await apiClient.get<{ blockedUsers: BlockedUser[] }>('/api/blocked-users');
      setUsers(res.data.blockedUsers);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBlocked(); }, [fetchBlocked]);

  const handleUnblock = async () => {
    if (!unblockTarget) return;
    setUnblocking(true);
    try {
      await apiClient.delete(`/api/users/${unblockTarget.userId}/block`);
      setUsers(prev => prev.filter(u => u.userId !== unblockTarget.userId));
      setUnblockTarget(null);
    } catch {
      // keep dialog open
    } finally {
      setUnblocking(false);
    }
  };

  return (
    <SettingsShell>
      <SettingsPanel
        icon={<Ban className="h-5 w-5 text-white" />}
        title="Blocked Users"
        description="People you've blocked can't see your profile or contact you."
      >
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
            <p className="text-white/50 text-sm">Loading…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 bg-rose-500/10 rounded-full flex items-center justify-center mb-3">
              <Ban className="w-7 h-7 text-rose-400/70" />
            </div>
            <p className="text-white/60 text-sm mb-4">Failed to load blocked users.</p>
            <button
              onClick={fetchBlocked}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/10 border border-white/20 hover:bg-white/15 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
              <Ban className="w-8 h-8 text-white/40" />
            </div>
            <h3 className="text-lg font-bold font-heading mb-1">No blocked users</h3>
            <p className="text-white/50 text-sm max-w-sm">
              People you block will appear here.
            </p>
          </div>
        )}

        {/* List */}
        {!loading && !error && users.length > 0 && (
          <div className="space-y-3">
            {users.map(user => (
              <div
                key={user.userId}
                className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 backdrop-blur-sm"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 shrink-0 flex items-center justify-center">
                  {user.photo ? (
                    <ImageWithFallback
                      src={user.photo}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-white/40" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{user.name}</p>
                  <p className="text-xs text-white/50 truncate">
                    {user.city}, {user.country}
                  </p>
                </div>

                {/* Unblock */}
                <button
                  onClick={() => setUnblockTarget(user)}
                  className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold border border-white/20 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Unblock confirmation dialog */}
        <AlertDialog
          open={!!unblockTarget}
          onOpenChange={(v) => { if (!v) setUnblockTarget(null); }}
        >
          <AlertDialogContent className="bg-[#2E1065] border border-white/10 rounded-2xl text-white max-w-md">
            <AlertDialogHeader className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-rose-500/15 rounded-full flex items-center justify-center mb-2">
                <Ban className="w-7 h-7 text-rose-400" />
              </div>
              <AlertDialogTitle className="text-xl font-bold text-white">
                Unblock {unblockTarget?.name}?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-white/50 text-sm mt-1">
                They'll be able to see your profile and contact you again.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="flex-row gap-3 sm:justify-center mt-2">
              <button
                onClick={() => setUnblockTarget(null)}
                disabled={unblocking}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 hover:text-white transition-colors backdrop-blur-md"
              >
                Cancel
              </button>
              <button
                onClick={handleUnblock}
                disabled={unblocking}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-white text-purple-900 hover:bg-purple-100 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {unblocking && <Loader2 className="w-4 h-4 animate-spin" />}
                Unblock
              </button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SettingsPanel>
    </SettingsShell>
  );
}
