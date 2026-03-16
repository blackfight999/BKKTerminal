'use client';

import { PropertyListing } from '@/types/property';
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';

interface AnomalyPanelProps {
  anomalies: PropertyListing[];
  selectedZone: string | null;
}

const SOURCE_COLORS: Record<string, string> = {
  DDProperty: 'text-blue-400',
  FazWaz: 'text-purple-400',
  Hipflat: 'text-orange-400',
  DotProperty: 'text-green-400',
};

export default function AnomalyPanel({ anomalies, selectedZone }: AnomalyPanelProps) {
  const filtered = selectedZone ? anomalies.filter(a => a.zone === selectedZone) : anomalies;
  const underpriced = filtered.filter(a => a.anomaly === 'underpriced');
  const overpriced = filtered.filter(a => a.anomaly === 'overpriced');
  const display = filtered.slice(0, 12);

  return (
    <div className="bg-zinc-900 border border-zinc-700 flex flex-col h-full">
      <div className="px-3 py-2 border-b border-zinc-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={12} className="text-amber-400" />
          <span className="text-amber-400 font-mono text-xs font-bold tracking-wider">ANOMALY FLAGS</span>
          <span className="text-zinc-500 font-mono text-xs">±25% from district median</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-green-400 flex items-center gap-1">
            <TrendingDown size={10} /> {underpriced.length} underpriced
          </span>
          <span className="text-red-400 flex items-center gap-1">
            <TrendingUp size={10} /> {overpriced.length} overpriced
          </span>
        </div>
      </div>

      <div className="overflow-auto flex-1">
        <table className="w-full font-mono text-xs">
          <thead className="sticky top-0 bg-zinc-900">
            <tr className="border-b border-zinc-700 text-zinc-500">
              <th className="text-left px-3 py-1.5 font-normal">ID</th>
              <th className="text-left px-2 py-1.5 font-normal">SOURCE</th>
              <th className="text-left px-2 py-1.5 font-normal">ZONE</th>
              <th className="text-right px-2 py-1.5 font-normal">฿/SQM</th>
              <th className="text-right px-2 py-1.5 font-normal">SQM</th>
              <th className="text-right px-2 py-1.5 font-normal">DELTA</th>
              <th className="text-right px-3 py-1.5 font-normal">FLAG</th>
            </tr>
          </thead>
          <tbody>
            {display.map(l => (
              <tr key={l.id} className="border-b border-zinc-800/40 hover:bg-zinc-800/30">
                <td className="px-3 py-1 text-zinc-500">{l.id}</td>
                <td className={`px-2 py-1 ${SOURCE_COLORS[l.source]}`}>{l.source}</td>
                <td className="px-2 py-1 text-zinc-300">{l.zone}</td>
                <td className="text-right px-2 py-1 text-cyan-400">฿{l.pricePerSqm.toLocaleString()}</td>
                <td className="text-right px-2 py-1 text-zinc-400">{l.area}</td>
                <td className={`text-right px-2 py-1 font-bold ${l.anomaly === 'underpriced' ? 'text-green-400' : 'text-red-400'}`}>
                  {(l.anomalyDelta ?? 0) > 0 ? '+' : ''}{l.anomalyDelta}%
                </td>
                <td className="text-right px-3 py-1">
                  {l.anomaly === 'underpriced' ? (
                    <span className="text-green-400 bg-green-400/10 px-1.5 py-0.5 text-xs">DEAL</span>
                  ) : (
                    <span className="text-red-400 bg-red-400/10 px-1.5 py-0.5 text-xs">HIGH</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="px-3 py-4 text-zinc-500 font-mono text-xs text-center">
            No anomalies in {selectedZone || 'selected zone'}
          </div>
        )}
      </div>
    </div>
  );
}
