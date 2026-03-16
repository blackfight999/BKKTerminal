'use client';

import { useState, useMemo } from 'react';
import { PropertyListing, Source } from '@/types/property';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ListingsTableProps {
  listings: PropertyListing[];
  selectedZone: string | null;
}

const SOURCE_COLORS: Record<Source, string> = {
  DDProperty: 'text-blue-400',
  FazWaz: 'text-purple-400',
  Hipflat: 'text-orange-400',
  DotProperty: 'text-green-400',
};

type SortKey = 'pricePerSqm' | 'price' | 'area' | 'daysOnMarket';
type SortDir = 'asc' | 'desc';

export default function ListingsTable({ listings, selectedZone }: ListingsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('pricePerSqm');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filterSource, setFilterSource] = useState<Source | 'ALL'>('ALL');
  const [filterBeds, setFilterBeds] = useState<number | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  }

  const filtered = useMemo(() => {
    let rows = listings.filter(l => l.listingType === 'Sale');
    if (selectedZone) rows = rows.filter(l => l.zone === selectedZone);
    if (filterSource !== 'ALL') rows = rows.filter(l => l.source === filterSource);
    if (filterBeds !== 'ALL') rows = rows.filter(l => l.bedrooms === filterBeds);
    rows = [...rows].sort((a, b) => {
      const v = a[sortKey] - b[sortKey];
      return sortDir === 'asc' ? v : -v;
    });
    return rows;
  }, [listings, selectedZone, filterSource, filterBeds, sortKey, sortDir]);

  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="text-zinc-600">⇅</span>;
    return sortDir === 'asc' ? <ChevronUp size={10} className="inline" /> : <ChevronDown size={10} className="inline" />;
  }

  return (
    <div className="bg-zinc-900 border border-zinc-700 flex flex-col">
      <div className="px-3 py-2 border-b border-zinc-700 flex items-center gap-4 flex-wrap">
        <span className="text-amber-400 font-mono text-xs font-bold tracking-wider">LISTINGS</span>
        <span className="text-zinc-500 font-mono text-xs">{filtered.length} results</span>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-zinc-500 font-mono text-xs">SOURCE:</span>
          {(['ALL', 'DDProperty', 'FazWaz', 'Hipflat', 'DotProperty'] as const).map(s => (
            <button
              key={s}
              onClick={() => { setFilterSource(s); setPage(0); }}
              className={`font-mono text-xs px-1.5 py-0.5 border ${
                filterSource === s
                  ? 'border-amber-400 text-amber-400'
                  : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
              }`}
            >
              {s}
            </button>
          ))}
          <span className="text-zinc-500 font-mono text-xs ml-2">BED:</span>
          {(['ALL', 1, 2, 3] as const).map(b => (
            <button
              key={b}
              onClick={() => { setFilterBeds(b); setPage(0); }}
              className={`font-mono text-xs px-1.5 py-0.5 border ${
                filterBeds === b
                  ? 'border-amber-400 text-amber-400'
                  : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-auto flex-1">
        <table className="w-full font-mono text-xs">
          <thead className="sticky top-0 bg-zinc-900">
            <tr className="border-b border-zinc-700 text-zinc-500">
              <th className="text-left px-3 py-1.5 font-normal">ID</th>
              <th className="text-left px-2 py-1.5 font-normal">SOURCE</th>
              <th className="text-left px-2 py-1.5 font-normal">ZONE</th>
              <th className="text-left px-2 py-1.5 font-normal">SUBZONE</th>
              <th className="text-right px-2 py-1.5 font-normal cursor-pointer hover:text-zinc-300" onClick={() => handleSort('pricePerSqm')}>
                ฿/SQM <SortIcon k="pricePerSqm" />
              </th>
              <th className="text-right px-2 py-1.5 font-normal cursor-pointer hover:text-zinc-300" onClick={() => handleSort('price')}>
                PRICE <SortIcon k="price" />
              </th>
              <th className="text-right px-2 py-1.5 font-normal cursor-pointer hover:text-zinc-300" onClick={() => handleSort('area')}>
                SQM <SortIcon k="area" />
              </th>
              <th className="text-right px-2 py-1.5 font-normal">BED</th>
              <th className="text-right px-2 py-1.5 font-normal">FLR</th>
              <th className="text-right px-2 py-1.5 font-normal cursor-pointer hover:text-zinc-300" onClick={() => handleSort('daysOnMarket')}>
                DOM <SortIcon k="daysOnMarket" />
              </th>
              <th className="text-right px-3 py-1.5 font-normal">YR</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((l) => (
              <tr key={l.id} className="border-b border-zinc-800/40 hover:bg-zinc-800/30 transition-colors">
                <td className="px-3 py-1 text-zinc-500">{l.id}</td>
                <td className={`px-2 py-1 ${SOURCE_COLORS[l.source]}`}>{l.source}</td>
                <td className="px-2 py-1 text-zinc-300">{l.zone}</td>
                <td className="px-2 py-1 text-zinc-500">{l.subzone}</td>
                <td className="text-right px-2 py-1 text-cyan-400 font-bold">฿{l.pricePerSqm.toLocaleString()}</td>
                <td className="text-right px-2 py-1 text-zinc-300">
                  {l.price >= 10_000_000 ? `${(l.price / 1_000_000).toFixed(1)}M` : `${(l.price / 1000).toFixed(0)}K`}
                </td>
                <td className="text-right px-2 py-1 text-zinc-400">{l.area}</td>
                <td className="text-right px-2 py-1 text-zinc-400">{l.bedrooms}</td>
                <td className="text-right px-2 py-1 text-zinc-500">{l.floor}/{l.totalFloors}</td>
                <td className={`text-right px-2 py-1 ${l.daysOnMarket > 90 ? 'text-red-400' : l.daysOnMarket < 30 ? 'text-green-400' : 'text-zinc-400'}`}>
                  {l.daysOnMarket}d
                </td>
                <td className="text-right px-3 py-1 text-zinc-500">{l.yearBuilt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-3 py-2 border-t border-zinc-700 flex items-center justify-between font-mono text-xs text-zinc-500">
        <span>Page {page + 1} of {totalPages}</span>
        <div className="flex gap-2">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-2 py-0.5 border border-zinc-700 disabled:opacity-30 hover:border-zinc-500">
            ◀ PREV
          </button>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-2 py-0.5 border border-zinc-700 disabled:opacity-30 hover:border-zinc-500">
            NEXT ▶
          </button>
        </div>
      </div>
    </div>
  );
}
