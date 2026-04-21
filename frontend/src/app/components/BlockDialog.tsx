import { useState } from 'react';
import { Ban, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from './ui/alert-dialog';
import apiClient from '../lib/api';

interface BlockDialogProps {
  open: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
  isBlocked: boolean;
  onToggled: (blocked: boolean) => void;
}

export function BlockDialog({
  open,
  onClose,
  userId,
  userName,
  isBlocked,
  onToggled,
}: BlockDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (isBlocked) {
        await apiClient.delete(`/api/users/${userId}/block`);
        onToggled(false);
      } else {
        await apiClient.post(`/api/users/${userId}/block`);
        onToggled(true);
      }
      onClose();
    } catch {
      // keep dialog open on error — user can retry or cancel
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <AlertDialogContent
        className="bg-[#2E1065] border border-white/10 rounded-2xl text-white max-w-md"
      >
        <AlertDialogHeader className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-rose-500/15 rounded-full flex items-center justify-center mb-2">
            <Ban className="w-7 h-7 text-rose-400" />
          </div>
          <AlertDialogTitle className="text-xl font-bold text-white">
            {isBlocked ? `Unblock ${userName}?` : `Block ${userName}?`}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/50 text-sm mt-1">
            {isBlocked
              ? "They'll be able to see your profile and contact you again."
              : "They won't be able to see your profile or contact you, and you won't see them again. You can unblock them later in Settings."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-row gap-3 sm:justify-center mt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 hover:text-white transition-colors backdrop-blur-md"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
              ${isBlocked
                ? 'bg-white text-purple-900 hover:bg-purple-100'
                : 'bg-rose-500 text-white hover:bg-rose-600'
              }
              disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isBlocked ? 'Unblock' : 'Block'}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
