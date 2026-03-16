'use client';

import { useState } from 'react';
import { Bell, Trash2, Plus } from 'lucide-react';
import { PriceAlert } from '@/types/property';

const ZONES = ['Thonglor', 'Ekkamai', 'Asok', 'Phrom Phong', 'Silom', 'Ari', 'Ratchada', 'On Nut', 'Phra Khanong', 'Lad Phrao'];

const MOCK_ALERTS: PriceAlert[] = [
  { id: 'A001', zone: 'Ari', propertyType: 'Condo', thresholdPricePerSqm: 150000, direction: 'below', email: 'investor@example.com', active: true, createdAt: '2026-03-10T00:00:00Z' },
  { id: 'A002', zone: 'On Nut', propertyType: 'Condo', thresholdPricePerSqm: 100000, direction: 'below', email: 'investor@example.com', active: true, createdAt: '2026-03-12T00:00:00Z' },
];

export default function PriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>(MOCK_ALERTS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    zone: 'Thonglor',
    direction: 'below' as 'below' | 'above',
    threshold: '',
    email: '',
  });

  function addAlert() {
    if (!form.threshold || !form.email) return;
    const newAlert: PriceAlert = {
      id: `A${String(alerts.length + 1).padStart(3, '0')}`,
      zone: form.zone,
      propertyType: 'Condo',
      thresholdPricePerSqm: parseInt(form.threshold),
      direction: form.direction,
      email: form.email,
      active: true,
      createdAt: new Date().toISOString(),
    };
    setAlerts(prev => [...prev, newAlert]);
    setShowForm(false);
    setForm({ zone: 'Thonglor', direction: 'below', threshold: '', email: '' });
  }

  function removeAlert(id: string) {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }

  const MAX_FREE_ALERTS = 5;

  return (
    <div className="bg-zinc-900 border border-zinc-700 flex flex-col">
      <div className="px-3 py-2 border-b border-zinc-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={12} className="text-yellow-400" />
          <span className="text-yellow-400 font-mono text-xs font-bold tracking-wider">PRICE ALERTS</span>
          <span className="text-zinc-500 font-mono text-xs">{alerts.length}/{MAX_FREE_ALERTS} free</span>
        </div>
        {alerts.length < MAX_FREE_ALERTS && (
          <button
            onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-1 font-mono text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 px-2 py-0.5 hover:border-zinc-500"
          >
            <Plus size={10} />
            NEW ALERT
          </button>
        )}
      </div>

      {showForm && (
        <div className="px-3 py-2 border-b border-zinc-700 bg-zinc-800/50 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-zinc-500 font-mono text-xs">ZONE</label>
            <select
              value={form.zone}
              onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
              className="bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-xs px-2 py-1 focus:outline-none focus:border-yellow-400"
            >
              {ZONES.map(z => <option key={z}>{z}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-zinc-500 font-mono text-xs">DIRECTION</label>
            <select
              value={form.direction}
              onChange={e => setForm(f => ({ ...f, direction: e.target.value as 'below' | 'above' }))}
              className="bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-xs px-2 py-1 focus:outline-none focus:border-yellow-400"
            >
              <option value="below">drops below</option>
              <option value="above">rises above</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-zinc-500 font-mono text-xs">฿/SQM THRESHOLD</label>
            <input
              type="number"
              placeholder="e.g. 150000"
              value={form.threshold}
              onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))}
              className="bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-xs px-2 py-1 w-32 focus:outline-none focus:border-yellow-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-zinc-500 font-mono text-xs">EMAIL</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-xs px-2 py-1 w-48 focus:outline-none focus:border-yellow-400"
            />
          </div>
          <button
            onClick={addAlert}
            disabled={!form.threshold || !form.email}
            className="font-mono text-xs px-3 py-1 bg-yellow-400 text-zinc-900 font-bold hover:bg-yellow-300 disabled:opacity-40"
          >
            SET ALERT
          </button>
          <button onClick={() => setShowForm(false)} className="font-mono text-xs text-zinc-500 hover:text-zinc-300">
            CANCEL
          </button>
        </div>
      )}

      <div className="divide-y divide-zinc-800/50">
        {alerts.map(alert => (
          <div key={alert.id} className="px-3 py-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-yellow-400 font-mono text-xs">{alert.id}</span>
              <span className="font-mono text-xs text-zinc-300">{alert.zone}</span>
              <span className="font-mono text-xs text-zinc-500">
                {alert.direction === 'below' ? '↓ drops below' : '↑ rises above'}
              </span>
              <span className="font-mono text-xs text-cyan-400">฿{alert.thresholdPricePerSqm.toLocaleString()}/sqm</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-zinc-500">{alert.email}</span>
              <span className="font-mono text-xs text-green-400 bg-green-400/10 px-1.5 py-0.5">ACTIVE</span>
              <button onClick={() => removeAlert(alert.id)} className="text-zinc-600 hover:text-red-400">
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="px-3 py-3 text-zinc-600 font-mono text-xs">No active alerts. Create one above.</div>
        )}
      </div>
    </div>
  );
}
