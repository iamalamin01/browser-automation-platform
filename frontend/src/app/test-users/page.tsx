'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Users, Trash2, Link, Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { testUsersApi } from '@/lib/api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageLoader, LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { formatDate } from '@/lib/utils';

interface TestUser {
  id: string; userId: string; firstName: string; lastName: string;
  email: string; gender: string | null; phone: string | null;
  status: string; createdAt: string;
  browserProfiles?: { profileId: string; name: string }[];
}

export default function TestUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [bulkCount, setBulkCount] = useState(5);

  const { data, isLoading } = useQuery({
    queryKey: ['test-users', search],
    queryFn: () => testUsersApi.list({ search, limit: 50 }).then((r) => r.data),
  });

  const genMutation = useMutation({
    mutationFn: () => testUsersApi.generate(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['test-users'] }); toast.success('Test user generated!'); },
    onError: () => toast.error('Failed to generate user'),
  });

  const bulkMutation = useMutation({
    mutationFn: (count: number) => testUsersApi.generateMultiple(count),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['test-users'] });
      toast.success(`Generated ${res.data.created} users!`);
    },
    onError: () => toast.error('Failed to generate users'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => testUsersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['test-users'] }); toast.success('Deleted'); },
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Test Users</h1>
          <p className="text-slate-500 text-sm">{data?.total ?? 0} synthetic test users</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <input
              type="number" min={1} max={50}
              value={bulkCount}
              onChange={(e) => setBulkCount(Number(e.target.value))}
              className="w-16 px-2 py-2 border border-gray-200 rounded-lg text-sm text-center"
            />
            <button
              onClick={() => bulkMutation.mutate(bulkCount)}
              disabled={bulkMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 text-sm font-medium disabled:opacity-50"
            >
              {bulkMutation.isPending ? <LoadingSpinner size="sm" /> : <Users className="w-4 h-4" />}
              Bulk Generate
            </button>
          </div>
          <button
            onClick={() => genMutation.mutate()}
            disabled={genMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
          >
            {genMutation.isPending ? <LoadingSpinner size="sm" /> : <UserPlus className="w-4 h-4" />}
            Generate User
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="Search by name, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">User</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Phone</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Assigned Profile</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Created</th>
              <th className="text-right px-4 py-3 text-slate-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data?.users?.map((u: TestUser) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-slate-400">{u.userId}</p>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{u.email}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{u.phone || '—'}</td>
                <td className="px-4 py-3">
                  {u.browserProfiles?.[0]
                    ? <span className="text-blue-600 text-xs">{u.browserProfiles[0].name}</span>
                    : <span className="text-slate-400 text-xs">Not assigned</span>}
                </td>
                <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-1.5 hover:bg-blue-100 rounded" title="Assign to profile"><Link className="w-3.5 h-3.5 text-blue-500" /></button>
                    <button onClick={() => deleteMutation.mutate(u.id)} className="p-1.5 hover:bg-red-100 rounded" title="Delete"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.users?.length === 0 && (
          <p className="text-center py-10 text-slate-400">No test users. Click &quot;Generate User&quot; to create one!</p>
        )}
      </div>
    </div>
  );
}
