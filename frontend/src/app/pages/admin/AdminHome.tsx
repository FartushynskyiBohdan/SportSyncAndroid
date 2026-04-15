import { useEffect, useState } from 'react';
import apiClient from '../../config/api';

interface OverviewStats {
  totalUsers: number;
  activeUsers: number;
  totalMatches: number;
  openReports: number;
}

export function AdminHome() {
  const [stats, setStats] = useState<OverviewStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalMatches: 0,
    openReports: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/api/admin/overview');
        setStats(response.data);
      } catch (err) {
        setError('Unable to load admin overview.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const tiles = [
    {
      label: 'Total users',
      value: stats.totalUsers,
      description: 'All registered accounts',
    },
    {
      label: 'Active users',
      value: stats.activeUsers,
      description: 'Logged in within the last 30 days',
    },
    {
      label: 'Total matches',
      value: stats.totalMatches,
      description: 'Connections made across the platform',
    },
    {
      label: 'Open reports',
      value: stats.openReports,
      description: 'Complaints that need review',
    },
  ];

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-purple-300/80">Admin dashboard</p>
          <h1 className="text-4xl font-black text-white">Welcome back, Operator</h1>
          <p className="max-w-2xl text-slate-400 mt-3">Review user activity, manage accounts, and keep the community safe.</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-10 text-center text-slate-300">Loading overview...</div>
      ) : error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">{error}</div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {tiles.map((tile) => (
            <div key={tile.label} className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/10">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{tile.label}</p>
              <p className="mt-4 text-4xl font-black text-white">{tile.value}</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">{tile.description}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
