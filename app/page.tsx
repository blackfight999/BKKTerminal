'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import StatsBar from '@/components/StatsBar';
import ZonePriceChart from '@/components/ZonePriceChart';
import TrendChart from '@/components/TrendChart';
import ZoneTable from '@/components/ZoneTable';
import ListingsTable from '@/components/ListingsTable';
import AnomalyPanel from '@/components/AnomalyPanel';
import AIMarketSummary from '@/components/AIMarketSummary';
import TransitFilter from '@/components/TransitFilter';
import PriceAlerts from '@/components/PriceAlerts';
import { listings, getZoneSummaries, getMarketTrends, getSourceStats, getAnomalies } from '@/lib/mockData';
import { Station } from '@/lib/transitData';

const allZoneSummaries = getZoneSummaries();
const allMarketTrends = getMarketTrends();
const allSourceStats = getSourceStats();
const allAnomalies = getAnomalies();

type Tab = 'market' | 'anomalies' | 'alerts';

export default function Dashboard() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [transitZones, setTransitZones] = useState<string[] | null>(null);
  const [activeStation, setActiveStation] = useState<Station | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('market');

  const activeZones = transitZones ?? null;

  const filteredSummaries = useMemo(() =>
    activeZones ? allZoneSummaries.filter(z => activeZones.includes(z.zone)) : allZoneSummaries,
    [activeZones]
  );

  const saleListings = useMemo(() => {
    let l = listings.filter(ll => ll.listingType === 'Sale');
    if (activeZones) l = l.filter(ll => activeZones.includes(ll.zone));
    return l;
  }, [activeZones]);

  const anomalies = useMemo(() =>
    activeZones ? allAnomalies.filter(a => activeZones.includes(a.zone)) : allAnomalies,
    [activeZones]
  );

  const selectedZoneSummary = useMemo(() =>
    selectedZone ? allZoneSummaries.find(z => z.zone === selectedZone) ?? null : null,
    [selectedZone]
  );

  function handleTransitFilter(zones: string[] | null, station: Station | null) {
    setTransitZones(zones);
    setActiveStation(station);
    if (selectedZone && zones && !zones.includes(selectedZone)) {
      setSelectedZone(null);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'market', label: 'MARKET' },
    { id: 'anomalies', label: `ANOMALIES (${anomalies.length})` },
    { id: 'alerts', label: 'ALERTS' },
  ];

  return (
    <div className="h-screen bg-zinc-950 text-zinc-300 flex flex-col overflow-hidden" style={{ fontFamily: 'ui-monospace, monospace' }}>
      <Header lastUpdated="16 Mar 2026 02:00 ICT" />
      <StatsBar
        zoneSummaries={filteredSummaries}
        sourceStats={allSourceStats}
        totalListings={saleListings.length}
      />
      <TransitFilter onZonesFilter={handleTransitFilter} />

      {/* Tab bar */}
      <div className="flex border-b border-zinc-700 bg-zinc-900">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 font-mono text-xs border-r border-zinc-700 transition-colors ${
              activeTab === tab.id
                ? 'text-amber-400 bg-zinc-800 border-b-2 border-b-amber-400'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
        {activeStation && (
          <span className="ml-auto px-3 py-1.5 font-mono text-xs text-cyan-400">
            Filtered: {activeStation.line} · {activeStation.name}
            {activeZones && ` — ${activeZones.length} zone${activeZones.length !== 1 ? 's' : ''}`}
          </span>
        )}
      </div>

      {/* Market tab */}
      {activeTab === 'market' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Charts row */}
          <div className="grid grid-cols-2 border-b border-zinc-700 flex-shrink-0">
            <div className="border-r border-zinc-700">
              <ZonePriceChart
                data={filteredSummaries}
                selectedZone={selectedZone}
                onZoneSelect={(z) => setSelectedZone(prev => prev === z ? null : z)}
              />
            </div>
            <TrendChart data={allMarketTrends} />
          </div>

          {/* AI summary */}
          <div className="border-b border-zinc-700 flex-shrink-0">
            <AIMarketSummary selectedZone={selectedZone} zoneSummary={selectedZoneSummary} />
          </div>

          {/* Zone table + listings */}
          <div className="flex-1 grid grid-cols-[280px_1fr] overflow-hidden">
            <div className="border-r border-zinc-700 overflow-auto">
              <ZoneTable
                data={filteredSummaries}
                selectedZone={selectedZone}
                onZoneSelect={setSelectedZone}
              />
            </div>
            <div className="overflow-hidden flex flex-col">
              <ListingsTable listings={saleListings} selectedZone={selectedZone} />
            </div>
          </div>
        </div>
      )}

      {/* Anomalies tab */}
      {activeTab === 'anomalies' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="grid grid-cols-[280px_1fr] overflow-hidden flex-1">
            <div className="border-r border-zinc-700 overflow-auto">
              <ZoneTable
                data={filteredSummaries}
                selectedZone={selectedZone}
                onZoneSelect={setSelectedZone}
              />
            </div>
            <div className="overflow-hidden flex flex-col">
              <AnomalyPanel anomalies={anomalies} selectedZone={selectedZone} />
            </div>
          </div>
        </div>
      )}

      {/* Alerts tab */}
      {activeTab === 'alerts' && (
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-4 space-y-4">
            <PriceAlerts />
            <div className="border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-500">
              <p>Alerts are delivered as a daily digest email at 07:00 ICT. Maximum 5 active alerts on the free tier.</p>
              <p className="mt-1">One-click unsubscribe included in every email. Compliant with Thailand PDPA B.E. 2562.</p>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-zinc-700 px-4 py-1 flex items-center justify-between flex-shrink-0">
        <span className="font-mono text-xs text-zinc-600">
          DISCLAIMER: Data is simulated for demonstration. Not investment advice. AI summaries via claude-sonnet-4-20250514.
        </span>
        <span className="font-mono text-xs text-zinc-600">
          Sources: DDProperty · FazWaz · Hipflat · Dot Property · Scraped daily 02:00 ICT
        </span>
      </footer>
    </div>
  );
}
