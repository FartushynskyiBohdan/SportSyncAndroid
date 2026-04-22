import { Fragment, useEffect, useMemo, useState } from 'react';
import apiClient from '../../lib/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

interface ReportRow {
  id: number;
  reporter_id: number;
  reported_id: number;
  reporter_email: string;
  reported_email: string;
  reported_account_status: 'active' | 'suspended' | 'banned';
  type: string;
  description: string;
  status: string;
  created_at: string;
}

interface PriorComplaint {
  id: number;
  created_at: string;
  type: string;
  status: string;
  reporter_email: string;
  description: string | null;
}

interface PriorAction {
  action_id: number;
  action_type: 'warn' | 'suspend' | 'ban' | 'dismiss';
  previous_account_status: 'active' | 'suspended' | 'banned';
  new_account_status: 'active' | 'suspended' | 'banned';
  note: string | null;
  created_at: string;
  admin_email: string;
}

interface ReportContext {
  report: {
    id: number;
    internal_note: string | null;
  };
  reporterStats: {
    totalReports: number;
    openReports: number;
    isSerialReporter: boolean;
  };
  reportedUser: {
    id: number;
    email: string;
    fullName: string | null;
    bio: string | null;
    accountStatus: 'active' | 'suspended' | 'banned';
    suspendedUntil: string | null;
    suspensionReason: string | null;
    createdAt: string;
    photos: string[];
  };
  priorComplaints: PriorComplaint[];
  priorActions: PriorAction[];
}

const reportStatusOptions = ['Pending', 'Under Review', 'Resolved', 'Dismissed'];
const reportStatusToId: Record<string, number> = {
  Pending: 1,
  'Under Review': 2,
  Resolved: 3,
  Dismissed: 4,
};
const moderationActionOptions = ['warn', 'suspend', 'ban', 'dismiss'] as const;

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function accountAge(createdAt: string) {
  const ms = Date.now() - new Date(createdAt).getTime();
  const days = Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  if (days < 30) return `${days} day${days === 1 ? '' : 's'}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'}`;
}

export function AdminReports() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<Record<number, string>>({});
  const [contexts, setContexts] = useState<Record<number, ReportContext>>({});
  const [expandedReportId, setExpandedReportId] = useState<number | null>(null);
  const [loadingContextId, setLoadingContextId] = useState<number | null>(null);
  const [selectedActions, setSelectedActions] = useState<Record<number, (typeof moderationActionOptions)[number]>>({});
  const [internalNotes, setInternalNotes] = useState<Record<number, string>>({});
  const [suspensionReasons, setSuspensionReasons] = useState<Record<number, string>>({});
  const [suspensionUntilValues, setSuspensionUntilValues] = useState<Record<number, string>>({});
  const [savingIds, setSavingIds] = useState<Record<number, boolean>>({});
  const [banConfirmId, setBanConfirmId] = useState<number | null>(null);

  const fetchReports = async () => {
    try {
      const response = await apiClient.get('/api/admin/reports');
      setReports(response.data);
      setSelectedStatuses(
        response.data.reduce((acc: Record<number, string>, report: ReportRow) => {
          acc[report.id] = report.status;
          return acc;
        }, {})
      );
      setError('');
    } catch (err) {
      setError('Could not load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleStatusChange = (id: number, status: string) => {
    setSelectedStatuses((current) => ({ ...current, [id]: status }));
  };

  const handleActionChange = (id: number, action: (typeof moderationActionOptions)[number]) => {
    setSelectedActions((current) => ({ ...current, [id]: action }));
  };

  const handleNoteChange = (id: number, value: string) => {
    setInternalNotes((current) => ({ ...current, [id]: value }));
  };

  const loadReportContext = async (id: number, force = false) => {
    if (!force && contexts[id]) {
      return;
    }

    try {
      setLoadingContextId(id);
      const response = await apiClient.get(`/api/admin/reports/${id}/context`);
      const context = response.data as ReportContext;
      setContexts((current) => ({ ...current, [id]: context }));
      if (context.report.internal_note) {
        setInternalNotes((current) => ({ ...current, [id]: context.report.internal_note || '' }));
      }
      if (context.reportedUser.suspensionReason) {
        setSuspensionReasons((current) => ({ ...current, [id]: context.reportedUser.suspensionReason || '' }));
      }
      if (context.reportedUser.suspendedUntil) {
        const value = new Date(context.reportedUser.suspendedUntil);
        if (!Number.isNaN(value.getTime())) {
          setSuspensionUntilValues((current) => ({
            ...current,
            [id]: new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16),
          }));
        }
      }
    } catch {
      setError('Could not load detailed report context.');
    } finally {
      setLoadingContextId((current) => (current === id ? null : current));
    }
  };

  const toggleExpanded = async (id: number) => {
    const nextExpanded = expandedReportId === id ? null : id;
    setExpandedReportId(nextExpanded);
    if (nextExpanded !== null) {
      await loadReportContext(nextExpanded);
    }
  };

  const handleUpdateStatus = async (id: number) => {
    const nextStatus = selectedStatuses[id];
    const statusId = reportStatusToId[nextStatus];

    if (!statusId) {
      setError('Please choose a valid report status.');
      return;
    }

    try {
      await apiClient.patch(`/api/admin/reports/${id}/status`, { statusId });
      setReports((current) =>
        current.map((report) =>
          report.id === id ? { ...report, status: nextStatus } : report
        )
      );
    } catch (err) {
      setError('Could not update report status.');
    }
  };

  const handleApplyModeration = async (id: number) => {
    const action = selectedActions[id];
    if (!action) {
      setError('Choose an action: Warn, Suspend, Ban, or Dismiss.');
      return;
    }

    if (action === 'ban') {
      setBanConfirmId(id);
      return;
    }

    await applyModeration(id);
  };

  const applyModeration = async (id: number) => {
    const action = selectedActions[id];
    try {
      setSavingIds((current) => ({ ...current, [id]: true }));
      await apiClient.post(`/api/admin/reports/${id}/moderate`, {
        action,
        statusName: selectedStatuses[id],
        note: internalNotes[id] || '',
        suspensionReason: suspensionReasons[id] || '',
        suspendedUntil: suspensionUntilValues[id] || '',
      });

      await fetchReports();
      await loadReportContext(id, true);
      setError('');
    } catch {
      setError('Could not apply moderation action.');
    } finally {
      setSavingIds((current) => ({ ...current, [id]: false }));
    }
  };

  const filteredReports = useMemo(
    () => [...reports].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [reports]
  );

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-purple-300/80">Admin reports</p>
          <h1 className="text-4xl font-black text-white">User safety reviews</h1>
          <p className="max-w-2xl text-slate-400 mt-3">Inspect incoming complaints, review reported users, and resolve issues responsibly.</p>
        </div>
      </div>

      <AlertDialog open={banConfirmId !== null} onOpenChange={(open) => { if (!open) setBanConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently ban this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately and permanently disable the account. The user will not be able to log in. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-500 text-white"
              onClick={() => {
                const id = banConfirmId!;
                setBanConfirmId(null);
                void applyModeration(id);
              }}
            >
              Yes, ban user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-10 text-center text-slate-300">Loading reports...</div>
      ) : error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">{error}</div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-slate-900/80 shadow-lg shadow-black/10">
          <table className="min-w-full text-left divide-y divide-white/10">
            <thead className="bg-slate-950/80 text-slate-400">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em]">Report ID</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em]">Reporter</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em]">Reported</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em]">Type</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em]">Description</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em]">Status</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em]">Account</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredReports.map((report) => {
                const context = contexts[report.id];
                const isExpanded = expandedReportId === report.id;
                const isBusy = !!savingIds[report.id];

                return (
                  <Fragment key={report.id}>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-200">#{report.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-200">{report.reporter_email}</td>
                      <td className="px-6 py-4 text-sm text-slate-200">{report.reported_email}</td>
                      <td className="px-6 py-4 text-sm text-slate-200">{report.type}</td>
                      <td className="px-6 py-4 text-sm text-slate-200 max-w-xl truncate">{report.description || 'No description'}</td>
                      <td className="px-6 py-4 text-sm text-slate-200">
                        <select
                          value={selectedStatuses[report.id] || report.status}
                          onChange={(e) => handleStatusChange(report.id, e.target.value)}
                          className="rounded-2xl border border-white/10 bg-slate-950/90 px-3 py-2 text-sm text-white outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
                        >
                          {reportStatusOptions.map((option) => (
                            <option key={option} value={option} className="bg-slate-900 text-white">
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-200 capitalize">{report.reported_account_status}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleUpdateStatus(report.id)}
                            className="rounded-full bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-400 transition-colors"
                          >
                            Save status
                          </button>
                          <button
                            onClick={() => void toggleExpanded(report.id)}
                            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 transition-colors"
                          >
                            {isExpanded ? 'Hide review' : 'Open review'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded ? (
                      <tr>
                        <td className="px-6 pb-6" colSpan={8}>
                          {loadingContextId === report.id && !context ? (
                            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 text-sm text-slate-300">Loading report context...</div>
                          ) : context ? (
                            <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-5 lg:grid-cols-2">
                              <div className="space-y-4">
                                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Reporter context</p>
                                  <p className="mt-2 text-sm text-white">{report.reporter_email}</p>
                                  <p className="mt-1 text-sm text-slate-300">Total reports submitted: {context.reporterStats.totalReports}</p>
                                  <p className="text-sm text-slate-300">Open reports submitted: {context.reporterStats.openReports}</p>
                                  {context.reporterStats.isSerialReporter ? (
                                    <p className="mt-2 inline-flex rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">Serial reporter flag</p>
                                  ) : null}
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Reported user profile</p>
                                  <p className="mt-2 text-sm text-white">{context.reportedUser.fullName || context.reportedUser.email}</p>
                                  <p className="text-sm text-slate-300">Email: {context.reportedUser.email}</p>
                                  <p className="text-sm text-slate-300 capitalize">Account status: {context.reportedUser.accountStatus}</p>
                                  {context.reportedUser.suspendedUntil ? (
                                    <p className="text-sm text-slate-300">Suspended until: {formatDate(context.reportedUser.suspendedUntil)}</p>
                                  ) : null}
                                  {context.reportedUser.suspensionReason ? (
                                    <p className="text-sm text-slate-300">Suspension reason: {context.reportedUser.suspensionReason}</p>
                                  ) : null}
                                  <p className="text-sm text-slate-300">Account age: {accountAge(context.reportedUser.createdAt)}</p>
                                  <p className="mt-2 text-sm text-slate-300">{context.reportedUser.bio || 'No bio available.'}</p>
                                  {context.reportedUser.photos.length > 0 ? (
                                    <div className="mt-3 grid grid-cols-3 gap-2">
                                      {context.reportedUser.photos.map((photo, idx) => (
                                        <img
                                          key={`${report.id}-photo-${idx}`}
                                          src={photo}
                                          alt={`Reported user ${idx + 1}`}
                                          className="h-20 w-full rounded-xl object-cover"
                                        />
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Prior complaints against reported user</p>
                                  {context.priorComplaints.length === 0 ? (
                                    <p className="mt-2 text-sm text-slate-300">No prior complaints.</p>
                                  ) : (
                                    <div className="mt-3 max-h-44 space-y-2 overflow-y-auto pr-1">
                                      {context.priorComplaints.map((item) => (
                                        <div key={item.id} className="rounded-xl border border-white/10 bg-slate-950/70 p-3 text-sm">
                                          <p className="text-slate-200">#{item.id} • {item.type} • {item.status}</p>
                                          <p className="text-slate-400">Reporter: {item.reporter_email}</p>
                                          <p className="text-slate-400">{formatDate(item.created_at)}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Prior actions (audit trail)</p>
                                  {context.priorActions.length === 0 ? (
                                    <p className="mt-2 text-sm text-slate-300">No prior admin actions recorded.</p>
                                  ) : (
                                    <div className="mt-3 max-h-44 space-y-2 overflow-y-auto pr-1">
                                      {context.priorActions.map((item) => (
                                        <div key={item.action_id} className="rounded-xl border border-white/10 bg-slate-950/70 p-3 text-sm">
                                          <p className="text-slate-200 capitalize">{item.action_type} • {item.previous_account_status} -&gt; {item.new_account_status}</p>
                                          <p className="text-slate-400">By: {item.admin_email}</p>
                                          <p className="text-slate-400">{formatDate(item.created_at)}</p>
                                          {item.note ? <p className="mt-1 text-slate-300">{item.note}</p> : null}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Moderation action</p>
                                  <div className="mt-3 grid gap-3">
                                    <select
                                      value={selectedActions[report.id] || ''}
                                      onChange={(e) => handleActionChange(report.id, e.target.value as (typeof moderationActionOptions)[number])}
                                      className="rounded-2xl border border-white/10 bg-slate-950/90 px-3 py-2 text-sm text-white outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
                                    >
                                      <option value="" disabled>
                                        Select action
                                      </option>
                                      {moderationActionOptions.map((option) => (
                                        <option key={option} value={option} className="bg-slate-900 text-white capitalize">
                                          {option}
                                        </option>
                                      ))}
                                    </select>

                                    <textarea
                                      value={internalNotes[report.id] || ''}
                                      onChange={(e) => handleNoteChange(report.id, e.target.value)}
                                      maxLength={1000}
                                      rows={3}
                                      placeholder="Internal note for moderation log..."
                                      className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-3 py-2 text-sm text-white outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
                                    />

                                    {selectedActions[report.id] === 'suspend' ? (
                                      <>
                                        <textarea
                                          value={suspensionReasons[report.id] || ''}
                                          onChange={(e) => setSuspensionReasons((current) => ({ ...current, [report.id]: e.target.value }))}
                                          maxLength={500}
                                          rows={3}
                                          placeholder="Suspension reason shown to the user..."
                                          className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-3 py-2 text-sm text-white outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
                                        />
                                        <input
                                          type="datetime-local"
                                          value={suspensionUntilValues[report.id] || ''}
                                          onChange={(e) => setSuspensionUntilValues((current) => ({ ...current, [report.id]: e.target.value }))}
                                          className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-3 py-2 text-sm text-white outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
                                        />
                                      </>
                                    ) : null}

                                    <button
                                      onClick={() => void handleApplyModeration(report.id)}
                                      disabled={isBusy}
                                      className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {isBusy ? 'Applying...' : 'Apply action'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 text-sm text-slate-300">
                              No context found for this report.
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
