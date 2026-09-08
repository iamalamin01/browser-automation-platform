'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { scenariosApi } from '@/lib/api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { formatDate } from '@/lib/utils';

const STEP_ACTIONS = [
  'NAVIGATE','CLICK','FILL','SELECT','WAIT_FOR_ELEMENT','WAIT_FOR_URL',
  'ASSERT_TEXT','ASSERT_VISIBLE','ASSERT_URL','SCREENSHOT','SCROLL','HOVER','PRESS_KEY','EVALUATE',
];

interface Step { action: string; selector: string; value: string; description: string; }
interface Scenario {
  id: string; name: string; targetUrl: string; environment: string;
  isEnabled: boolean; createdAt: string;
  steps: { id: string; stepOrder: number; action: string; selector: string | null; description: string | null }[];
  _count: { automationTasks: number };
}

export default function ScenariosPage() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '', targetUrl: '', environment: 'STAGING', timeout: 30000, retryCount: 1,
    steps: [{ action: 'NAVIGATE', selector: '', value: '', description: 'Open page' }] as Step[],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['scenarios'],
    queryFn: () => scenariosApi.list({ limit: 50 }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: typeof form) => scenariosApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['scenarios'] }); setShowModal(false); toast.success('Scenario created'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => scenariosApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['scenarios'] }); toast.success('Deleted'); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => scenariosApi.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scenarios'] }),
  });

  const addStep = () =>
    setForm((f) => ({ ...f, steps: [...f.steps, { action: 'CLICK', selector: '', value: '', description: '' }] }));

  const updateStep = (idx: number, field: keyof Step, val: string) =>
    setForm((f) => ({ ...f, steps: f.steps.map((s, i) => i === idx ? { ...s, [field]: val } : s) }));

  const removeStep = (idx: number) =>
    setForm((f) => ({ ...f, steps: f.steps.filter((_, i) => i !== idx) }));

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Test Scenarios</h1>
          <p className="text-slate-500 text-sm">{data?.total ?? 0} scenarios</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> New Scenario
        </button>
      </div>

      <div className="space-y-3">
        {data?.scenarios?.map((s: Scenario) => (
          <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800">{s.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${s.isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{s.targetUrl} · {s.environment} · {s.steps?.length ?? 0} steps · {s._count?.automationTasks ?? 0} tasks</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button onClick={() => toggleMutation.mutate(s.id)} className="p-1.5 hover:bg-slate-100 rounded">
                  {s.isEnabled ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                </button>
                <button onClick={() => deleteMutation.mutate(s.id)} className="p-1.5 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4 text-red-400" /></button>
                <button onClick={() => setExpanded(expanded === s.id ? null : s.id)} className="p-1.5 hover:bg-slate-100 rounded">
                  {expanded === s.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {expanded === s.id && (
              <div className="border-t border-gray-100 px-5 py-3">
                <p className="text-xs font-semibold text-slate-500 mb-2">STEPS</p>
                <ol className="space-y-1.5">
                  {s.steps?.map((step) => (
                    <li key={step.id} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-bold">{step.stepOrder}</span>
                      <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{step.action}</span>
                      {step.selector && <span className="text-slate-400 text-xs truncate">{step.selector}</span>}
                      {step.description && <span className="text-slate-500 text-xs">{step.description}</span>}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ))}
        {data?.scenarios?.length === 0 && <p className="text-center py-10 text-slate-400">No scenarios. Create your first test scenario!</p>}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto py-6">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl mx-4">
            <h2 className="text-lg font-semibold mb-4">New Test Scenario</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Name *</label>
                  <input className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Registration Test" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Target URL *</label>
                  <input className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" value={form.targetUrl} onChange={(e) => setForm({ ...form, targetUrl: e.target.value })} placeholder="https://staging.example.com" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Environment</label>
                  <select className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })}>
                    {['DEVELOPMENT','STAGING','QA','SANDBOX','LOCALHOST'].map((e) => <option key={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Timeout (ms)</label>
                  <input type="number" className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" value={form.timeout} onChange={(e) => setForm({ ...form, timeout: Number(e.target.value) })} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">Steps</label>
                  <button onClick={addStep} className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ Add Step</button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {form.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <span className="text-xs text-slate-400 w-4">{idx + 1}</span>
                      <select className="text-xs border border-gray-200 rounded px-1.5 py-1" value={step.action} onChange={(e) => updateStep(idx, 'action', e.target.value)}>
                        {STEP_ACTIONS.map((a) => <option key={a}>{a}</option>)}
                      </select>
                      <input className="flex-1 text-xs border border-gray-200 rounded px-1.5 py-1" placeholder="selector" value={step.selector} onChange={(e) => updateStep(idx, 'selector', e.target.value)} />
                      <input className="flex-1 text-xs border border-gray-200 rounded px-1.5 py-1" placeholder="value" value={step.value} onChange={(e) => updateStep(idx, 'value', e.target.value)} />
                      <input className="flex-1 text-xs border border-gray-200 rounded px-1.5 py-1" placeholder="description" value={step.description} onChange={(e) => updateStep(idx, 'description', e.target.value)} />
                      <button onClick={() => removeStep(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={() => createMutation.mutate(form)} disabled={!form.name || !form.targetUrl || createMutation.isPending} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {createMutation.isPending ? 'Creating...' : 'Create Scenario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
