'use client';

import { useState } from 'react';
import { Train, X } from 'lucide-react';
import { stations, Station, getZonesNearStation } from '@/lib/transitData';

interface TransitFilterProps {
  onZonesFilter: (zones: string[] | null, station: Station | null) => void;
}

const LINE_COLORS: Record<Station['line'], string> = {
  'BTS Sukhumvit': 'text-green-400',
  'BTS Silom': 'text-green-400',
  'MRT Blue': 'text-blue-400',
  'MRT Purple': 'text-purple-400',
  'ARL': 'text-red-400',
};

const LINES = ['BTS Sukhumvit', 'BTS Silom', 'MRT Blue', 'ARL'] as const;

export default function TransitFilter({ onZonesFilter }: TransitFilterProps) {
  const [selectedLine, setSelectedLine] = useState<string>('');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [radius, setRadius] = useState<number>(1);

  const lineStations = stations.filter(s => s.line === selectedLine);

  function handleStationSelect(station: Station) {
    setSelectedStation(station);
    const zones = getZonesNearStation(station.id, radius);
    onZonesFilter(zones.length > 0 ? zones : [], station);
  }

  function handleRadiusChange(r: number) {
    setRadius(r);
    if (selectedStation) {
      const zones = getZonesNearStation(selectedStation.id, r);
      onZonesFilter(zones.length > 0 ? zones : [], selectedStation);
    }
  }

  function handleClear() {
    setSelectedLine('');
    setSelectedStation(null);
    onZonesFilter(null, null);
  }

  return (
    <div className="bg-zinc-900 border border-zinc-700 px-3 py-2 flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <Train size={12} className="text-cyan-400" />
        <span className="text-cyan-400 font-mono text-xs font-bold tracking-wider">BTS/MRT FILTER</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-zinc-500 font-mono text-xs">LINE:</span>
        <select
          value={selectedLine}
          onChange={e => { setSelectedLine(e.target.value); setSelectedStation(null); onZonesFilter(null, null); }}
          className="bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-xs px-2 py-0.5 focus:outline-none focus:border-cyan-400"
        >
          <option value="">— Select line —</option>
          {LINES.map(line => (
            <option key={line} value={line}>{line}</option>
          ))}
        </select>
      </div>

      {selectedLine && (
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 font-mono text-xs">STATION:</span>
          <select
            value={selectedStation?.id ?? ''}
            onChange={e => {
              const station = lineStations.find(s => s.id === e.target.value);
              if (station) handleStationSelect(station);
            }}
            className="bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-xs px-2 py-0.5 focus:outline-none focus:border-cyan-400"
          >
            <option value="">— Select station —</option>
            {lineStations.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {selectedStation && (
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 font-mono text-xs">RADIUS:</span>
          {([0.5, 1, 2] as const).map(r => (
            <button
              key={r}
              onClick={() => handleRadiusChange(r)}
              className={`font-mono text-xs px-1.5 py-0.5 border ${
                radius === r ? 'border-cyan-400 text-cyan-400' : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
              }`}
            >
              {r}km
            </button>
          ))}
        </div>
      )}

      {selectedStation && (
        <div className="flex items-center gap-3 ml-auto">
          <span className={`font-mono text-xs ${LINE_COLORS[selectedStation.line]}`}>
            {selectedStation.line} · {selectedStation.name}
          </span>
          <button onClick={handleClear} className="text-zinc-500 hover:text-zinc-300">
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
