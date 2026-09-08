import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  subtitle?: string;
}

const colorMap = {
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   text: 'text-blue-600' },
  green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600',  text: 'text-green-600' },
  yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-100 text-yellow-600', text: 'text-yellow-600' },
  red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600',       text: 'text-red-600' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', text: 'text-purple-600' },
  gray:   { bg: 'bg-gray-50',   icon: 'bg-gray-100 text-gray-600',     text: 'text-gray-600' },
};

export function StatCard({ title, value, icon: Icon, color = 'blue', subtitle }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn('rounded-xl p-5 border border-gray-100 shadow-sm', c.bg)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={cn('text-3xl font-bold mt-1', c.text)}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={cn('p-3 rounded-lg', c.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
