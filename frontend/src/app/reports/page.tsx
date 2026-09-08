'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { reportsApi } from '@/lib/api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { formatDate, formatDuration } from '@/lib/utils';

interface Run {
  id: string; status: string; totalSteps: number; passedSteps: number;
  failedSteps: number; duration: number | null; startedAt: string; finishedAt: string | null;
  screenshots: { id: string }[];
  task: {
    scenario: { name: string; targetUrl: string };
    profile: { profileId: string; name: string };
    testUser: { userId: string; firstName: string; lastName: string } | null;
  };
}

export default function ReportsPage() {
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['reports', statusFilter],
    queryFn: () => reportsApi.list({ status: statusFilter || undefined, limit: 50 }).then((r) => r.data),
  });

  if (isLoading) return <PageLoader />;

  const runs: Run[] = data?.runs || [];
  const passed = runs.filter((r) => r.status === 'PASSED').length;
  const failed = runs.filter((r) => r.status === 'FAILED' || r.status === 'ERROR').length;
  const running = runs.filter((r) => r.status === 'RUNNING').length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Test Reports</h1>
        <p className="text-slate-500 text-sm">{data?.total ?? 0} test runs total</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-xl border border-green-100 p-4 flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-green-500" />
          <div>
            <p className="text-2xl font-bold text-green-700">{passed}</p>
            <p className="text-xs text-green-600">Passed</p>
          </div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4 flex items-center gap-3">
          <XCircle className="w-8 h-8 text-red-500" />
          <div>
            <p className="text-2xl font-bold text-red-700">{failed}</p>
            <p className="text-xs text-red-600">Failed / Error</p>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-4 flex items-center gap-3">
          <Clock className="w-8 h-8 text-yellow-500" />
          <div>
            <p className="text-2xl font-bold text-yellow-700">{running}</p>
            <p className="text-xs text-yellow-600">Running</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {['', 'PASSED', 'FAILED', 'ERROR', 'RUNNING', 'ABORTED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Test</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Profile / User</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Steps</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Duration</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Screenshots</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Started</th>
              <th className="text-right px-4 py-3 text-slate-600 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {runs.map((run) => (
              <tr key={run.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{run.task.scenario.name}</p>
                  <p className="text-xs text-slate-400 truncate max-w-[180px]">{run.task.scenario.targetUrl}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-slate-700 text-xs">{run.task.profile.name}</p>
                  <p className="text-slate-400 text-xs">
                    {run.task.testUser ? `${run.task.testUser.firstName} ${run.task.testUser.lastName}` : 'No user'}
                  </p>
                </td>
                <td className="px-4 py-3"><StatusBadge status={run.status} /></td>
                <td className="px-4 py-3">
                  <span className="text-green-600 font-medium">{run.passedSteps}✓</span>
                  {' / '}
                  <span className="text-red-500">{run.failedSteps}✗</span>
                  <span className="text-slate-400 text-xs"> / {run.totalSteps}</span>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">
                  {run.duration ? formatDuration(run.duration) : '—'}
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{run.screenshots.length}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(run.startedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/reports/${run.id}`}
                    className="p-1.5 hover:bg-blue-100 rounded inline-flex"
                    title="View report"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {runs.length === 0 && (
          <p className="text-center py-10 text-slate-400">No test reports yet. Run a task to generate reports!</p>
        )}
      </div>
    </div>
  );
}
