'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Monitor, Users, ClipboardList,
  Play, BarChart3, LogOut, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/authStore';

const navItems = [
  { href: '/dashboard',   label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/profiles',    label: 'Browser Profiles', icon: Monitor },
  { href: '/test-users',  label: 'Test Users',       icon: Users },
  { href: '/scenarios',   label: 'Scenarios',        icon: ClipboardList },
  { href: '/tasks',       label: 'Tasks',            icon: Play },
  { href: '/reports',     label: 'Reports',          icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm leading-none">AutoBrowser</p>
          <p className="text-xs text-slate-400 mt-0.5">QA Platform</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              pathname.startsWith(href)
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.username || 'User'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
