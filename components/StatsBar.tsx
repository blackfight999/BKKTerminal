'use client';

import { ZoneSummary, SourceStats } from '@/types/property';

interface StatsBarProps {
  zoneSummaries: ZoneSummary[];
  sourceStats: SourceStats[];
  totalListings: number;
}

export default function StatsBar({ zoneSummaries, sourceStats, totalListings }: StatsBarProps) {
  const topZone = [...zoneSummaries].sort((a, b) => b.avgPricePerSqm - a.avgPricePerSqm)[0];
  const bottomZone = [...zoneSummaries].sort((a, b) => a.avgPricePerSqm - b.avgPricePerSqm)[0];
  const overallAvg = Math.round(zoneSummaries.reduce((s, z) => s + z.avgPricePerSqm, 0) / zoneSummaries.length);
  const gainers = zoneSummaries.filter(z => z.mom > 0).length;

  const stats = [
    { label: 'TOTAL LISTINGS', value: totalListings.toLocaleString(), color: 'text-zinc-200' },
    { label: 'ZONES TRACKED', value: zoneSummaries.length, color: 'text-zinc-200' },
    { label: 'MARKET AVG/SQM', value: `฿${overallAvg.toLocaleString()}`, color: 'text-cyan-400' },
    { label: 'HIGHEST ZONE', value: `${topZone?.zone} ฿${topZone?.avgPricePerSqm.toLocaleString()}`, color: 'text-amber-400' },
    { label: 'LOWEST ZONE', value: `${bottomZone?.zone} ฿${bottomZone?.avgPricePerSqm.toLocaleString()}`, color: 'text-zinc-400' },
    { label: 'MoM GAINERS', value: `${gainers}/${zoneSummaries.length} zones`, color: gainers > zoneSummaries.length / 2 ? 'text-green-400' : 'text-red-400' },
  ];

  return (
    <div className="border-b border-zinc-700 bg-zinc-900">
      <div className="flex items-stretch divide-x divide-zinc-700">
        {stats.map((s) => (
          <div key={s.label} className="flex-1 px-3 py-2 min-w-0">
            <div className="text-zinc-500 font-mono text-xs leading-tight">{s.label}</div>
            <div className={`font-mono text-sm font-bold leading-tight truncate ${s.color}`}>{s.value}</div>
          </div>
        ))}
        <div className="flex-1 px-3 py-2 min-w-0">
          <div className="text-zinc-500 font-mono text-xs leading-tight">DATA SOURCES</div>
          <div className="flex gap-2 mt-0.5">
            {sourceStats.map(s => (
              <span key={s.source} className="font-mono text-xs text-zinc-300">
                {s.source} <span className="text-zinc-500">({s.listingCount})</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
