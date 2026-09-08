'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { tasksApi } from '@/lib/api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { formatDate, formatDuration } from '@/lib/utils';

interface Log { id: string; level: string; source: string; message: string; timestamp: string; stepOrder: number | null; }
interface Screenshot { id: string; filename: string; path: string; type: string; takenAt: string; }
interface NetworkLog { id: string; method: string; url: string; statusCode: number | null; isError: boolean; timestamp: string; }

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.get(id).then((r) => r.data),
    refetchInterval: 3000,
  });

  if (isLoading) return <PageLoader />;
  if (!task) return <p className="text-center py-20 text-slate-400">Task not found</p>;

  const latestRun = task.testRuns?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/tasks" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{task.taskId}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={task.status} />
            <span className="text-sm text-slate-400">{task.scenario?.name}</span>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Profile', value: task.profile?.name },
          { label: 'Test User', value: task.testUser ? `${task.testUser.firstName} ${task.testUser.lastName}` : 'Not assigned' },
          { label: 'Scenario', value: task.scenario?.name },
          { label: 'Target URL', value: task.scenario?.targetUrl },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
            <p className="text-sm font-medium text-slate-800 mt-1 truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Latest Run Summary */}
      {latestRun && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Latest Run Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            {[
              { label: 'Status', value: <StatusBadge status={latestRun.status} /> },
              { label: 'Total Steps', value: latestRun.totalSteps },
              { label: 'Passed', value: <span className="text-green-600 font-bold">{latestRun.passedSteps}</span> },
              { label: 'Failed', value: <span className="text-red-600 font-bold">{latestRun.failedSteps}</span> },
              { label: 'Duration', value: latestRun.duration ? formatDuration(latestRun.duration) : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 uppercase font-medium tracking-wide">{label}</p>
                <div className="text-sm font-semibold mt-1">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution Logs */}
      {latestRun?.logs?.length > 0 && (
        <div className="bg-slate-900 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700">
            <h2 className="font-semibold text-slate-200 text-sm">Execution Logs</h2>
          </div>
          <div className="max-h-72 overflow-y-auto font-mono text-xs p-4 space-y-1">
            {latestRun.logs.map((log: Log) => (
              <div key={log.id} className={`flex gap-3 ${log.level === 'ERROR' ? 'text-red-400' : log.level === 'WARN' ? 'text-yellow-400' : 'text-green-300'}`}>
                <span className="text-slate-500 flex-shrink-0 text-xs">[{formatDate(log.timestamp)}]</span>
                <span className="text-slate-400">[{log.source}]</span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Network Logs */}
      {latestRun?.networkLogs?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-slate-800">Network Logs</h2>
          </div>
          <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
            {latestRun.networkLogs.map((n: NetworkLog) => (
              <div key={n.id} className={`px-5 py-2 flex items-center gap-3 text-xs ${n.isError ? 'bg-red-50' : ''}`}>
                <span className="font-mono font-bold text-slate-500 w-12">{n.method}</span>
                <span className={`font-bold w-12 ${n.statusCode && n.statusCode >= 400 ? 'text-red-600' : 'text-green-600'}`}>{n.statusCode}</span>
                <span className="truncate text-slate-600 flex-1">{n.url}</span>
                <span className="text-slate-400 text-xs flex-shrink-0">{formatDate(n.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Screenshots */}
      {latestRun?.screenshots?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Screenshots</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {latestRun.screenshots.map((ss: Screenshot) => (
              <a
                key={ss.id}
                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${ss.path}`}
                target="_blank"
                rel="noreferrer"
                className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${ss.path}`}
                  alt={ss.filename}
                  className="w-full h-36 object-cover bg-slate-100"
                />
                <div className="px-2 py-1.5 flex items-center justify-between">
                  <p className="text-xs text-slate-500 truncate">{ss.filename}</p>
                  <StatusBadge status={ss.type} />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* No runs yet */}
      {!latestRun && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-slate-400">No runs yet. Press Start to begin the automation.</p>
        </div>
      )}
    </div>
  );
}
