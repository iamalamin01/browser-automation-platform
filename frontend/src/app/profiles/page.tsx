'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Play, StopCircle, Copy, Trash2, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { profilesApi } from '@/lib/api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { formatDate } from '@/lib/utils';

interface Profile {
  id: string; profileId: string; name: string; browserType: string;
  status: string; createdAt: string;
  testUser?: { firstName: string; lastName: string; email: string } | null;
}

export default function ProfilesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', browserType: 'CHROMIUM', userAgent: '', notes: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['profiles', search],
    queryFn: () => profilesApi.list({ search, limit: 50 }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: typeof form) => profilesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profiles'] }); setShowModal(false); toast.success('Profile created'); },
    onError: () => toast.error('Failed to create profile'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => profilesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profiles'] }); toast.success('Deleted'); },
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => profilesApi.start(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
  });

  const stopMutation = useMutation({
    mutationFn: (id: string) => profilesApi.stop(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
  });

  const dupMutation = useMutation({
    mutationFn: (id: string) => profilesApi.duplicate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profiles'] }); toast.success('Duplicated'); },
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Browser Profiles</h1>
          <p className="text-slate-500 text-sm">{data?.total ?? 0} profiles total</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> New Profile
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="Search profiles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Profile</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Browser</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Assigned User</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Created</th>
              <th className="text-right px-4 py-3 text-slate-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data?.profiles?.map((p: Profile) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.profileId}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{p.browserType}</td>
                <td className="px-4 py-3">
                  {p.testUser
                    ? <span className="text-slate-700">{p.testUser.firstName} {p.testUser.lastName}</span>
                    : <span className="text-slate-400 text-xs">Not assigned</span>}
                </td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(p.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {p.status !== 'RUNNING' && p.status !== 'ACTIVE'
                      ? <button onClick={() => startMutation.mutate(p.id)} className="p-1.5 hover:bg-green-100 rounded" title="Start"><Play className="w-3.5 h-3.5 text-green-600" /></button>
                      : <button onClick={() => stopMutation.mutate(p.id)} className="p-1.5 hover:bg-red-100 rounded" title="Stop"><StopCircle className="w-3.5 h-3.5 text-red-500" /></button>
                    }
                    <button onClick={() => dupMutation.mutate(p.id)} className="p-1.5 hover:bg-blue-100 rounded" title="Duplicate"><Copy className="w-3.5 h-3.5 text-blue-500" /></button>
                    <button onClick={() => deleteMutation.mutate(p.id)} className="p-1.5 hover:bg-red-100 rounded" title="Delete"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.profiles?.length === 0 && (
          <p className="text-center py-10 text-slate-400">No profiles found. Create your first profile!</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">New Browser Profile</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Profile Name *</label>
                <input
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="e.g. Test Profile 001"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Browser Type</label>
                <select
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  value={form.browserType}
                  onChange={(e) => setForm({ ...form, browserType: e.target.value })}
                >
                  <option>CHROMIUM</option>
                  <option>FIREFOX</option>
                  <option>WEBKIT</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">User Agent (optional)</label>
                <input
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="Custom user agent..."
                  value={form.userAgent}
                  onChange={(e) => setForm({ ...form, userAgent: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.name || createMutation.isPending}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
