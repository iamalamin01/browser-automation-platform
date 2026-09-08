'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Play, StopCircle, RefreshCw, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { tasksApi, profilesApi, testUsersApi, scenariosApi } from '@/lib/api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { formatDate } from '@/lib/utils';

interface Task {
  id: string; taskId: string; status: string; startedAt: string | null; createdAt: string;
  profile: { name: string; profileId: string };
  testUser: { firstName: string; lastName: string } | null;
  scenario: { name: string };
  testRuns: { status: string }[];
}

export default function TasksPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ profileId: '', testUserId: '', scenarioId: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.list({ limit: 50 }).then((r) => r.data),
    refetchInterval: 5000,
  });

  const { data: profilesData } = useQuery({
    queryKey: ['profiles-select'],
    queryFn: () => profilesApi.list({ limit: 100 }).then((r) => r.data),
    enabled: showModal,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-select'],
    queryFn: () => testUsersApi.list({ limit: 100 }).then((r) => r.data),
    enabled: showModal,
  });

  const { data: scenariosData } = useQuery({
    queryKey: ['scenarios-select'],
    queryFn: () => scenariosApi.list({ limit: 100, enabled: 'true' }).then((r) => r.data),
    enabled: showModal,
  });

  const createMutation = useMutation({
    mutationFn: (d: typeof form) => tasksApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); setShowModal(false); toast.success('Task created'); },
    onError: () => toast.error('Failed to create task'),
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => tasksApi.start(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task queued!'); },
    onError: (err: { response?: { data?: { error?: string } } }) => toast.error(err?.response?.data?.error || 'Failed to start'),
  });

  const stopMutation = useMutation({
    mutationFn: (id: string) => tasksApi.stop(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => tasksApi.retry(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Retry queued'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Deleted'); },
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Automation Tasks</h1>
          <p className="text-slate-500 text-sm">{data?.total ?? 0} tasks</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Task</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Profile</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Test User</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Scenario</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Started</th>
              <th className="text-right px-4 py-3 text-slate-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data?.tasks?.map((t: Task) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{t.taskId}</p>
                  <p className="text-xs text-slate-400">{formatDate(t.createdAt)}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{t.profile?.name}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">
                  {t.testUser ? `${t.testUser.firstName} ${t.testUser.lastName}` : '—'}
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{t.scenario?.name}</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {t.startedAt ? formatDate(t.startedAt) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {['PENDING','FAILED','COMPLETED','STOPPED','CANCELLED'].includes(t.status) && (
                      <button onClick={() => startMutation.mutate(t.id)} className="p-1.5 hover:bg-green-100 rounded" title="Start"><Play className="w-3.5 h-3.5 text-green-600" /></button>
                    )}
                    {['RUNNING','QUEUED'].includes(t.status) && (
                      <button onClick={() => stopMutation.mutate(t.id)} className="p-1.5 hover:bg-red-100 rounded" title="Stop"><StopCircle className="w-3.5 h-3.5 text-red-500" /></button>
                    )}
                    {['FAILED','STOPPED'].includes(t.status) && (
                      <button onClick={() => retryMutation.mutate(t.id)} className="p-1.5 hover:bg-yellow-100 rounded" title="Retry"><RefreshCw className="w-3.5 h-3.5 text-yellow-600" /></button>
                    )}
                    <Link href={`/tasks/${t.id}`} className="p-1.5 hover:bg-blue-100 rounded" title="View details"><Eye className="w-3.5 h-3.5 text-blue-500" /></Link>
                    <button onClick={() => deleteMutation.mutate(t.id)} className="p-1.5 hover:bg-red-100 rounded" title="Delete"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.tasks?.length === 0 && <p className="text-center py-10 text-slate-400">No tasks yet. Create a task to start automation!</p>}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">New Automation Task</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Browser Profile *</label>
                <select className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" value={form.profileId} onChange={(e) => setForm({ ...form, profileId: e.target.value })}>
                  <option value="">Select profile...</option>
                  {profilesData?.profiles?.map((p: { id: string; profileId: string; name: string }) => <option key={p.id} value={p.id}>{p.name} ({p.profileId})</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Test User (optional)</label>
                <select className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" value={form.testUserId} onChange={(e) => setForm({ ...form, testUserId: e.target.value })}>
                  <option value="">Select user...</option>
                  {usersData?.users?.map((u: { id: string; userId: string; firstName: string; lastName: string }) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.userId})</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Scenario *</label>
                <select className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" value={form.scenarioId} onChange={(e) => setForm({ ...form, scenarioId: e.target.value })}>
                  <option value="">Select scenario...</option>
                  {scenariosData?.scenarios?.map((s: { id: string; name: string }) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={() => createMutation.mutate(form)} disabled={!form.profileId || !form.scenarioId || createMutation.isPending} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {createMutation.isPending ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
