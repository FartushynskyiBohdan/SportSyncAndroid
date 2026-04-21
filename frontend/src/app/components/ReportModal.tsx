import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import apiClient, { isAxiosError } from '../lib/api';

/* ─── Types ─── */

type ComplaintType = { id: number; name: string };

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
}

/* ─── Component ─── */

export function ReportModal({ open, onClose, userId, userName }: ReportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [types, setTypes] = useState<ComplaintType[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [typesError, setTypesError] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /* Reset all state every time the modal opens */
  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedTypeId(null);
      setDescription('');
      setSubmitting(false);
      setSubmitError(null);
    }
  }, [open]);

  /* Fetch complaint types when modal opens */
  const fetchTypes = useCallback(async () => {
    setTypesLoading(true);
    setTypesError(false);
    try {
      const res = await apiClient.get<{ types: ComplaintType[] }>('/api/complaint-types');
      setTypes(res.data.types);
    } catch {
      setTypesError(true);
    } finally {
      setTypesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && types.length === 0) fetchTypes();
  }, [open, types.length, fetchTypes]);

  /* Submit report */
  const handleSubmit = async () => {
    if (!selectedTypeId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiClient.post(`/api/users/${userId}/report`, {
        typeId: selectedTypeId,
        description: description.trim() || undefined,
      });
      setStep(3);
    } catch (err) {
      if (isAxiosError(err) && err.response?.data?.error) {
        setSubmitError(err.response.data.error);
      } else {
        setSubmitError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="bg-[#2E1065] border border-white/10 rounded-2xl text-white max-w-md [&>button.absolute]:text-white/50 [&>button.absolute]:hover:text-white"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* ── Step 1: Reason selection ── */}
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                Report {userName}
              </DialogTitle>
              <DialogDescription className="text-white/50 text-sm">
                Why are you reporting this person?
              </DialogDescription>
            </DialogHeader>

            {typesLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
              </div>
            )}

            {typesError && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-400/20 p-4 text-center">
                <p className="text-sm text-rose-300 mb-3">Failed to load report reasons.</p>
                <button
                  onClick={fetchTypes}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              </div>
            )}

            {!typesLoading && !typesError && (
              <div className="space-y-2">
                {types.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTypeId(t.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors
                      ${selectedTypeId === t.id
                        ? 'bg-purple-500/20 border-purple-400/30 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={!selectedTypeId}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all
                bg-white text-purple-900 hover:bg-purple-100
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              Next
            </button>
          </>
        )}

        {/* ── Step 2: Additional details ── */}
        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                Anything else you'd like to share?
              </DialogTitle>
              <DialogDescription className="text-white/50 text-sm">
                Optional — add any extra context about this report.
              </DialogDescription>
            </DialogHeader>

            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                rows={4}
                placeholder="Describe what happened…"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 resize-none"
              />
              <p className="text-xs text-white/40 mt-1 text-right">
                {description.length} / 500
              </p>
            </div>

            {submitError && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-400/20 p-3">
                <p className="text-sm text-rose-300">{submitError}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => { setSubmitError(null); setStep(1); }}
                className="text-sm font-medium text-white/50 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
                  bg-white text-purple-900 hover:bg-purple-100
                  disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Confirmation ── */}
        {step === 3 && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                Report submitted
              </DialogTitle>
              <DialogDescription className="text-white/50 text-sm mt-1">
                Thanks for helping keep SportSync safe. We'll review this report shortly.
              </DialogDescription>
            </DialogHeader>
            <button
              onClick={onClose}
              className="mt-6 w-full py-3 rounded-xl font-bold text-sm bg-white text-purple-900 hover:bg-purple-100 transition-all"
            >
              Done
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
