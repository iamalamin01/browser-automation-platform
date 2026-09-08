import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

export const STATUS_COLORS: Record<string, string> = {
  READY:     'bg-green-100 text-green-800',
  ACTIVE:    'bg-blue-100 text-blue-800',
  RUNNING:   'bg-yellow-100 text-yellow-800',
  STOPPED:   'bg-gray-100 text-gray-800',
  ERROR:     'bg-red-100 text-red-800',
  PENDING:   'bg-slate-100 text-slate-700',
  QUEUED:    'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED:    'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
  PAUSED:    'bg-orange-100 text-orange-800',
  PASSED:    'bg-green-100 text-green-800',
  AVAILABLE: 'bg-green-100 text-green-800',
  ASSIGNED:  'bg-blue-100 text-blue-800',
  IN_USE:    'bg-yellow-100 text-yellow-800',
  ARCHIVED:  'bg-gray-100 text-gray-600',
};
