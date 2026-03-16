'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { ZoneSummary } from '@/types/property';

interface ZonePriceChartProps {
  data: ZoneSummary[];
  selectedZone: string | null;
  onZoneSelect: (zone: string) => void;
}

function formatK(value: number) {
  return `${(value / 1000).toFixed(0)}k`;
}

export default function ZonePriceChart({ data, selectedZone, onZoneSelect }: ZonePriceChartProps) {
  const sorted = [...data].sort((a, b) => b.avgPricePerSqm - a.avgPricePerSqm);

  return (
    <div className="bg-zinc-900 border border-zinc-700 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-amber-400 font-mono text-xs font-bold tracking-wider">PRICE/SQM BY ZONE — SALE LISTINGS (THB)</span>
        <span className="text-zinc-500 font-mono text-xs">{data.length} zones</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <BarChart data={sorted} margin={{ top: 4, right: 8, left: 0, bottom: 4 }} onClick={(d: any) => d?.activePayload?.[0] && onZoneSelect(d.activePayload[0].payload.zone)}>
          <CartesianGrid strokeDasharray="2 4" stroke="#3f3f46" vertical={false} />
          <XAxis
            dataKey="zone"
            tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={{ stroke: '#3f3f46' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatK}
            tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 0, fontFamily: 'monospace', fontSize: 11 }}
            labelStyle={{ color: '#f59e0b' }}
            formatter={(value, name) => [`฿${Number(value).toLocaleString()}`, name === 'avgPricePerSqm' ? 'Avg/sqm' : String(name)]}
            cursor={{ fill: '#27272a' }}
          />
          <Bar dataKey="avgPricePerSqm" radius={0} cursor="pointer">
            {sorted.map((entry) => (
              <Cell
                key={entry.zone}
                fill={selectedZone === entry.zone ? '#f59e0b' : '#22d3ee'}
                opacity={selectedZone && selectedZone !== entry.zone ? 0.4 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
