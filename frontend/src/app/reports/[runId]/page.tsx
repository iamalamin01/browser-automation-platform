'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { reportsApi } from '@/lib/api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { formatDate, formatDuration } from '@/lib/utils';

export default function ReportDetailPage() {
  const { runId } = useParams<{ runId: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['report', runId],
    queryFn: () => reportsApi.get(runId).then((r) => r.data),
  });

  if (isLoading) return <PageLoader />;
  if (!data) return <p className="text-center py-20 text-slate-400">Report not found</p>;

  const { run, summary } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/reports" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Test Report</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={run.status} />
            <span className="text-sm text-slate-400">{run.task.scenario.name}</span>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-400 uppercase">Scenario</p>
            <p className="text-sm font-medium mt-1">{summary.test}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase">Profile</p>
            <p className="text-sm font-medium mt-1">{summary.profile}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase">Test User</p>
            <p className="text-sm font-medium mt-1">{summary.user || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase">Duration</p>
            <p className="text-sm font-medium mt-1">{summary.duration ? formatDuration(summary.duration) : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase">Total Steps</p>
            <p className="text-2xl font-bold text-slate-700 mt-1">{summary.totalSteps}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase">Passed</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{summary.passedSteps}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase">Failed</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{summary.failedSteps}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase">Screenshots</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{summary.screenshotCount}</p>
          </div>
        </div>

        {summary.errors?.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-xs font-semibold text-red-600 uppercase mb-2">Errors Detected</p>
            {summary.errors.slice(0, 5).map((e: { id: string; message: string; timestamp: string }) => (
              <p key={e.id} className="text-sm text-red-700">{e.message}</p>
            ))}
          </div>
        )}
      </div>

      {/* Logs */}
      {run.logs?.length > 0 && (
        <div className="bg-slate-900 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between">
            <h2 className="font-semibold text-slate-200 text-sm">Execution Logs</h2>
            <span className="text-xs text-slate-400">{run.logs.length} entries</span>
          </div>
          <div className="max-h-80 overflow-y-auto font-mono text-xs p-4 space-y-1">
            {run.logs.map((log: { id: string; level: string; source: string; message: string; timestamp: string }) => (
              <div key={log.id} className={`flex gap-2 ${log.level === 'ERROR' ? 'text-red-400' : log.level === 'WARN' ? 'text-yellow-300' : 'text-green-300'}`}>
                <span className="text-slate-500 flex-shrink-0">[{formatDate(log.timestamp)}]</span>
                <span className="text-slate-400 flex-shrink-0">[{log.source}]</span>
                <span className="break-all">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Network Logs */}
      {run.networkLogs?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-slate-800">Network Requests <span className="text-xs text-slate-400 ml-1">({run.networkLogs.length})</span></h2>
          </div>
          <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
            {run.networkLogs.map((n: { id: string; method: string; statusCode: number | null; url: string; isError: boolean; timestamp: string }) => (
              <div key={n.id} className={`px-5 py-2 flex items-center gap-3 text-xs ${n.isError ? 'bg-red-50' : ''}`}>
                <span className="font-mono font-bold text-slate-500 w-12">{n.method}</span>
                <span className={`font-bold w-10 ${n.statusCode && n.statusCode >= 400 ? 'text-red-600' : 'text-green-600'}`}>{n.statusCode}</span>
                <span className="truncate text-slate-600 flex-1">{n.url}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Screenshots */}
      {run.screenshots?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Screenshots ({run.screenshots.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {run.screenshots.map((ss: { id: string; path: string; filename: string; type: string }) => (
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
    </div>
  );
}
