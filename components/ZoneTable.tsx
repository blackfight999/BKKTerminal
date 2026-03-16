'use client';

import { ZoneSummary } from '@/types/property';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ZoneTableProps {
  data: ZoneSummary[];
  selectedZone: string | null;
  onZoneSelect: (zone: string | null) => void;
}

function MoM({ value }: { value: number }) {
  if (Math.abs(value) < 0.2) return <span className="text-zinc-500 flex items-center gap-0.5"><Minus size={10} />{value.toFixed(1)}%</span>;
  if (value > 0) return <span className="text-green-400 flex items-center gap-0.5"><TrendingUp size={10} />+{value.toFixed(1)}%</span>;
  return <span className="text-red-400 flex items-center gap-0.5"><TrendingDown size={10} />{value.toFixed(1)}%</span>;
}

export default function ZoneTable({ data, selectedZone, onZoneSelect }: ZoneTableProps) {
  const sorted = [...data].sort((a, b) => b.avgPricePerSqm - a.avgPricePerSqm);

  return (
    <div className="bg-zinc-900 border border-zinc-700 flex flex-col">
      <div className="px-3 py-2 border-b border-zinc-700 flex items-center justify-between">
        <span className="text-amber-400 font-mono text-xs font-bold tracking-wider">ZONE SUMMARY</span>
        {selectedZone && (
          <button onClick={() => onZoneSelect(null)} className="text-zinc-500 font-mono text-xs hover:text-zinc-300">
            [CLEAR]
          </button>
        )}
      </div>
      <div className="overflow-auto">
        <table className="w-full font-mono text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500">
              <th className="text-left px-3 py-1.5 font-normal">ZONE</th>
              <th className="text-right px-2 py-1.5 font-normal">AVG/SQM</th>
              <th className="text-right px-2 py-1.5 font-normal">MEDIAN</th>
              <th className="text-right px-2 py-1.5 font-normal">MoM</th>
              <th className="text-right px-2 py-1.5 font-normal">YoY</th>
              <th className="text-right px-3 py-1.5 font-normal">LISTINGS</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((z) => (
              <tr
                key={z.zone}
                onClick={() => onZoneSelect(selectedZone === z.zone ? null : z.zone)}
                className={`border-b border-zinc-800/50 cursor-pointer transition-colors ${
                  selectedZone === z.zone ? 'bg-amber-400/10' : 'hover:bg-zinc-800/50'
                }`}
              >
                <td className={`px-3 py-1.5 ${selectedZone === z.zone ? 'text-amber-400' : 'text-zinc-200'}`}>
                  {z.zone}
                </td>
                <td className="text-right px-2 py-1.5 text-cyan-400">
                  ฿{z.avgPricePerSqm.toLocaleString()}
                </td>
                <td className="text-right px-2 py-1.5 text-zinc-400">
                  ฿{z.medianPricePerSqm.toLocaleString()}
                </td>
                <td className="text-right px-2 py-1.5">
                  <MoM value={z.mom} />
                </td>
                <td className="text-right px-2 py-1.5">
                  <MoM value={z.yoy} />
                </td>
                <td className="text-right px-3 py-1.5 text-zinc-400">
                  {z.listingCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
