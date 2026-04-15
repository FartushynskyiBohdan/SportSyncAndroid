import { useEffect, useMemo, useState } from 'react';
import apiClient from '../../config/api';

interface ReportRow {
  id: number;
  reporter_email: string;
  reported_email: string;
  type: string;
  description: string;
  status: string;
  created_at: string;
}

const statusOptions = ['Pending', 'Under Review', 'Resolved', 'Dismissed'];

export function AdminReports() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<Record<number, string>>({});

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

  const handleUpdateStatus = async (id: number) => {
    const nextStatus = selectedStatuses[id];
    const statusId = statusOptions.indexOf(nextStatus) + 1;

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

  const filteredReports = useMemo(
    () => reports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
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
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-200">{report.id}</td>
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
                      {statusOptions.map((option) => (
                        <option key={option} value={option} className="bg-slate-900 text-white">
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleUpdateStatus(report.id)}
                      className="rounded-full bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-400 transition-colors"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
