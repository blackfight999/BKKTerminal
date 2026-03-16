'use client';

import { Activity, RefreshCw, Database, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  lastUpdated: string;
  dataSource?: 'scraped' | 'mock' | 'none';
  isStale?: boolean;
  cacheAge?: string | null;
}

export default function Header({ lastUpdated, dataSource, isStale, cacheAge }: HeaderProps) {
  return (
    <header className="border-b border-zinc-700 bg-zinc-900 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-amber-400" />
          <span className="text-amber-400 font-mono font-bold text-sm tracking-widest">BKK TERMINAL</span>
          <span className="text-zinc-500 font-mono text-xs">v1.0</span>
        </div>
        <div className="h-4 w-px bg-zinc-700" />
        <span className="text-zinc-400 font-mono text-xs">BANGKOK PROPERTY INTELLIGENCE</span>
        {dataSource === 'mock' && (
          <>
            <div className="h-4 w-px bg-zinc-700" />
            <span className="text-amber-500 font-mono text-xs flex items-center gap-1">
              <Database size={10} /> DEMO MODE
            </span>
          </>
        )}
        {dataSource === 'scraped' && isStale && (
          <>
            <div className="h-4 w-px bg-zinc-700" />
            <span className="text-red-400 font-mono text-xs flex items-center gap-1">
              <AlertTriangle size={10} /> DATA STALE ({cacheAge})
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-4 font-mono text-xs">
          <span className="text-zinc-500">THB/USD</span>
          <span className="text-green-400">34.82</span>
          <span className="text-zinc-500">SET</span>
          <span className="text-red-400">1,621.4 ▼0.3%</span>
          <span className="text-zinc-500">BOT RATE</span>
          <span className="text-zinc-300">2.50%</span>
        </div>
        <div className="h-4 w-px bg-zinc-700" />
        <div className="flex items-center gap-1 text-zinc-500 font-mono text-xs">
          <RefreshCw size={10} />
          <span>{lastUpdated}</span>
        </div>
      </div>
    </header>
  );
}
