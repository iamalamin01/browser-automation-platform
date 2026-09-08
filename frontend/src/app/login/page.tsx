'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(form.email, form.password);
      setAuth(res.data.token, res.data.user);
      toast.success('Logged in!');
      router.replace('/dashboard');
    } catch {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-3">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">AutoBrowser</h1>
          <p className="text-slate-400 text-sm mt-1">QA Automation Platform</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-2xl p-8 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Sign in to continue</h2>

          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="admin@browserauto.local"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-xs text-slate-400 mt-2">
            Default: <code className="bg-slate-100 px-1 rounded">admin@browserauto.local</code> / <code className="bg-slate-100 px-1 rounded">admin123</code>
          </p>
        </form>
      </div>
    </div>
  );
}
