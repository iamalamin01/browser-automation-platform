'use client';

import { useQuery } from '@tanstack/react-query';
import { Monitor, Users, Play, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { dashboardApi } from '@/lib/api';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats().then((r) => r.data),
    refetchInterval: 10_000,
  });

  if (isLoading) return <PageLoader />;

  const { profiles, tasks, testUsers, recentTasks, recentErrors } = data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Browser Automation Platform Overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Profiles"    value={profiles?.total ?? 0}     icon={Monitor}      color="blue" />
        <StatCard title="Active Profiles"   value={profiles?.active ?? 0}    icon={Monitor}      color="green" />
        <StatCard title="Test Users"        value={testUsers?.total ?? 0}    icon={Users}        color="purple" />
        <StatCard title="Running Tasks"     value={tasks?.running ?? 0}      icon={Play}         color="yellow" />
        <StatCard title="Completed Tasks"   value={tasks?.completed ?? 0}    icon={CheckCircle}  color="green" />
        <StatCard title="Failed Tasks"      value={tasks?.failed ?? 0}       icon={XCircle}      color="red" />
        <StatCard title="Pending Tasks"     value={tasks?.pending ?? 0}      icon={Clock}        color="gray" />
        <StatCard title="Recent Errors"     value={recentErrors?.length ?? 0} icon={AlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-slate-800">Recent Tasks</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentTasks?.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-slate-400">No tasks yet</p>
            )}
            {recentTasks?.map((task: { id: string; taskId: string; status: string; scenario: { name: string }; profile: { name: string }; createdAt: string }) => (
              <div key={task.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{task.taskId}</p>
                  <p className="text-xs text-slate-400">{task.scenario?.name} · {task.profile?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={task.status} />
                  <span className="text-xs text-slate-400">{formatDate(task.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Errors */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-slate-800">Recent Errors</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentErrors?.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-slate-400">No errors — all good!</p>
            )}
            {recentErrors?.map((err: { id: string; message: string; timestamp: string }) => (
              <div key={err.id} className="px-5 py-3">
                <p className="text-sm text-red-600 font-medium truncate">{err.message}</p>
                <p className="text-xs text-slate-400 mt-0.5">{formatDate(err.timestamp)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
