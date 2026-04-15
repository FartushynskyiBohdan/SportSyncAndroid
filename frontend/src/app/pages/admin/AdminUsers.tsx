import { useEffect, useMemo, useState } from 'react';
import apiClient from '../../config/api';

interface AdminUser {
  id: number;
  email: string;
  role: string;
  account_status: string;
  last_active: string | null;
  created_at: string;
}

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'banned'>('all');
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [confirmStage, setConfirmStage] = useState<1 | 2>(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/api/admin/users');
      setUsers(response.data);
      setError('');
    } catch (err) {
      setError('Could not load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesQuery =
        normalizedQuery === '' ||
        user.email.toLowerCase().includes(normalizedQuery) ||
        String(user.id).includes(normalizedQuery);

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.account_status === statusFilter;

      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [query, roleFilter, statusFilter, users]);

  const handleRoleToggle = async (user: AdminUser) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';

    try {
      await apiClient.patch(`/api/admin/users/${user.id}/role`, { role: nextRole });
      setUsers((current) =>
        current.map((item) => (item.id === user.id ? { ...item, role: nextRole } : item))
      );
      setError('');
      setSuccessMessage(`User ${user.email} is now ${nextRole}.`);
      window.setTimeout(() => setSuccessMessage(''), 3500);
    } catch (err) {
      setError('Failed to update user role.');
    }
  };

  const openDeleteDialog = (user: AdminUser) => {
    setDeleteTarget(user);
    setConfirmStage(1);
    setError('');
  };

  const closeDeleteDialog = () => {
    setDeleteTarget(null);
    setConfirmStage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/admin/users/${deleteTarget.id}`);
      setUsers((current) => current.filter((item) => item.id !== deleteTarget.id));
      setSuccessMessage(`Deleted user ${deleteTarget.email}.`);
      window.setTimeout(() => setSuccessMessage(''), 3500);
      closeDeleteDialog();
    } catch (err) {
      setError('Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteDialogTitle = confirmStage === 1 ? 'Are you sure?' : 'Like, for real?';
  const deleteDialogBody =
    confirmStage === 1
      ? 'Deleting this user will remove their account and all associated data. This action cannot be undone.'
      : 'This is your last chance. Confirm again if you want to permanently remove this user.';

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-purple-300/80">Admin users</p>
          <h1 className="text-4xl font-black text-white">User management</h1>
          <p className="max-w-2xl text-slate-400 mt-3">Review account roles, activity, and moderate access for the platform.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Search users</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by email or ID"
              className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Filter role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'user')}
              className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="all">All roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Filter status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'suspended' | 'banned')}
              className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-100">{successMessage}</div>
      )}
      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-10 text-center text-slate-300">Loading users...</div>
      ) : error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">{error}</div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-slate-900/80 shadow-lg shadow-black/10">
          <table className="min-w-full text-left divide-y divide-white/10">
            <thead className="bg-slate-950/80 text-slate-400">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em]">ID</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em]">Email</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em]">Role</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em]">Status</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em]">Last active</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-200">{user.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-200">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-200">{user.role}</td>
                  <td className="px-6 py-4 text-sm text-slate-200">{user.account_status}</td>
                  <td className="px-6 py-4 text-sm text-slate-200">{user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'}</td>
                  <td className="px-6 py-4 text-sm space-y-2">
                    <button
                      onClick={() => handleRoleToggle(user)}
                      className="w-full rounded-full bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-400 transition-colors"
                    >
                      {user.role === 'admin' ? 'Demote' : 'Promote'}
                    </button>
                    <button
                      onClick={() => openDeleteDialog(user)}
                      className="w-full rounded-full border border-red-500 bg-transparent px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl shadow-black/40">
            <h2 className="text-3xl font-black text-white">{deleteDialogTitle}</h2>
            <p className="mt-4 text-slate-300">{deleteDialogBody}</p>
            <p className="mt-3 text-sm text-slate-400">Target: {deleteTarget.email} (ID {deleteTarget.id})</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={closeDeleteDialog}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              {confirmStage === 1 ? (
                <button
                  onClick={() => setConfirmStage(2)}
                  className="rounded-full bg-yellow-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-yellow-400 transition-colors"
                >
                  Yes, I want to delete
                </button>
              ) : (
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="rounded-full bg-red-500 px-5 py-3 text-sm font-semibold text-white hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
                >
                  {isDeleting ? 'Deleting…' : 'Yes, delete for real'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
