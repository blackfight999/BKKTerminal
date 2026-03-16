'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MarketTrend } from '@/types/property';

interface TrendChartProps {
  data: MarketTrend[];
}

const ZONE_COLORS: Record<string, string> = {
  'Thonglor': '#f59e0b',
  'Asok': '#22d3ee',
  'Phrom Phong': '#a78bfa',
  'Silom': '#34d399',
  'Ekkamai': '#f87171',
};

export default function TrendChart({ data }: TrendChartProps) {
  const months = [...new Set(data.map(d => d.month))];
  const zones = [...new Set(data.map(d => d.zone))];

  const chartData = months.map(month => {
    const row: Record<string, string | number> = { month };
    zones.forEach(zone => {
      const point = data.find(d => d.month === month && d.zone === zone);
      if (point) row[zone] = point.avgPricePerSqm;
    });
    return row;
  });

  return (
    <div className="bg-zinc-900 border border-zinc-700 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-amber-400 font-mono text-xs font-bold tracking-wider">6-MONTH PRICE TREND — TOP ZONES (THB/SQM)</span>
        <span className="text-zinc-500 font-mono text-xs">Oct 2025 – Mar 2026</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="#3f3f46" />
          <XAxis
            dataKey="month"
            tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={{ stroke: '#3f3f46' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 0, fontFamily: 'monospace', fontSize: 11 }}
            labelStyle={{ color: '#a1a1aa' }}
            formatter={(value) => [`฿${Number(value).toLocaleString()}`, '']}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, fontFamily: 'monospace', color: '#a1a1aa' }}
          />
          {zones.map(zone => (
            <Line
              key={zone}
              type="monotone"
              dataKey={zone}
              stroke={ZONE_COLORS[zone] || '#a1a1aa'}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
