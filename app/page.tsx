'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
import ScrapeControl from '@/components/ScrapeControl';
import { listings as mockListings, getZoneSummaries, getMarketTrends, getSourceStats, getAnomalies } from '@/lib/mockData';
import { PropertyListing, ZoneSummary, SourceStats } from '@/types/property';
import { Station } from '@/lib/transitData';

type Tab = 'market' | 'anomalies' | 'alerts' | 'scraper';

interface LiveData {
  source: 'scraped' | 'mock' | 'none';
  listings: PropertyListing[];
  zoneSummaries: ZoneSummary[];
  sourceStats: SourceStats[];
  anomalies: PropertyListing[];
  scrapedAt: string | null;
  isStale: boolean;
  cacheAge: string | null;
  scrapeStats?: Array<{ source: string; scraped: number; normalized: number; status: 'success' | 'partial' | 'failed'; error?: string }>;
  totalRaw?: number;
  totalAfterDedup?: number;
}

export default function Dashboard() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [transitZones, setTransitZones] = useState<string[] | null>(null);
  const [activeStation, setActiveStation] = useState<Station | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('market');
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Load real data from API, fallback to mock
  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/listings');
      if (res.ok) {
        const data = await res.json();
        if (data.listings?.length > 0) {
          setLiveData({ ...data, source: 'scraped' });
          return;
        }
      }
    } catch (err) {
      console.warn('Could not load live data, using mock:', err);
    }
    // Fallback to mock data
    setLiveData({
      source: 'mock',
      listings: mockListings.filter(l => l.listingType === 'Sale'),
      zoneSummaries: getZoneSummaries(),
      sourceStats: getSourceStats(),
      anomalies: getAnomalies(),
      scrapedAt: null,
      isStale: false,
      cacheAge: null,
    });
    setLoadingData(false);
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoadingData(false));
  }, [loadData]);

  const data = liveData ?? {
    source: 'mock' as const,
    listings: mockListings.filter(l => l.listingType === 'Sale'),
    zoneSummaries: getZoneSummaries(),
    sourceStats: getSourceStats(),
    anomalies: getAnomalies(),
    scrapedAt: null,
    isStale: false,
    cacheAge: null,
  };

  const activeZones = transitZones ?? null;

  const filteredSummaries = useMemo(() =>
    activeZones ? data.zoneSummaries.filter(z => activeZones.includes(z.zone)) : data.zoneSummaries,
    [activeZones, data.zoneSummaries]
  );

  const saleListings = useMemo(() => {
    let l = data.listings;
    if (activeZones) l = l.filter(ll => activeZones.includes(ll.zone));
    return l;
  }, [activeZones, data.listings]);

  const anomalies = useMemo(() =>
    activeZones ? data.anomalies.filter(a => activeZones.includes(a.zone)) : data.anomalies,
    [activeZones, data.anomalies]
  );

  const selectedZoneSummary = useMemo(() =>
    selectedZone ? data.zoneSummaries.find(z => z.zone === selectedZone) ?? null : null,
    [selectedZone, data.zoneSummaries]
  );

  const marketTrends = useMemo(() => {
    const topZones = filteredSummaries.slice(0, 5).map(z => z.zone);
    return getMarketTrends(topZones[0]);
  }, [filteredSummaries]);

  function handleTransitFilter(zones: string[] | null, station: Station | null) {
    setTransitZones(zones);
    setActiveStation(station);
    if (selectedZone && zones && !zones.includes(selectedZone)) {
      setSelectedZone(null);
    }
  }

  const headerTimestamp = data.scrapedAt
    ? new Date(data.scrapedAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' }) + ' ICT'
    : new Date().toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' }) + ' ICT';

  const tabs: { id: Tab; label: string }[] = [
    { id: 'market', label: 'MARKET' },
    { id: 'anomalies', label: `ANOMALIES (${anomalies.length})` },
    { id: 'alerts', label: 'ALERTS' },
    { id: 'scraper', label: 'SCRAPER' },
  ];

  return (
    <div className="h-screen bg-zinc-950 text-zinc-300 flex flex-col overflow-hidden" style={{ fontFamily: 'ui-monospace, monospace' }}>
      <Header
        lastUpdated={headerTimestamp}
        dataSource={data.source}
        isStale={data.isStale}
        cacheAge={data.cacheAge}
      />
      <StatsBar
        zoneSummaries={filteredSummaries}
        sourceStats={data.sourceStats}
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
        <div className="flex items-center gap-2 ml-auto px-3">
          {loadingData && <span className="font-mono text-xs text-zinc-500 animate-pulse">LOADING DATA...</span>}
          {data.source === 'mock' && !loadingData && (
            <span className="font-mono text-xs text-amber-500">DEMO DATA — Run scraper for live data</span>
          )}
          {data.source === 'scraped' && (
            <span className="font-mono text-xs text-green-400">LIVE · {data.cacheAge}</span>
          )}
          {data.isStale && (
            <span className="font-mono text-xs text-red-400">⚠ DATA STALE</span>
          )}
          {activeStation && (
            <span className="font-mono text-xs text-cyan-400">
              {activeStation.line} · {activeStation.name}
              {activeZones && ` — ${activeZones.length} zone${activeZones.length !== 1 ? 's' : ''}`}
            </span>
          )}
        </div>
      </div>

      {/* Market tab */}
      {activeTab === 'market' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="grid grid-cols-2 border-b border-zinc-700 flex-shrink-0">
            <div className="border-r border-zinc-700">
              <ZonePriceChart
                data={filteredSummaries}
                selectedZone={selectedZone}
                onZoneSelect={(z) => setSelectedZone(prev => prev === z ? null : z)}
              />
            </div>
            <TrendChart data={marketTrends} />
          </div>
          <div className="border-b border-zinc-700 flex-shrink-0">
            <AIMarketSummary selectedZone={selectedZone} zoneSummary={selectedZoneSummary} />
          </div>
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
        <div className="flex-1 grid grid-cols-[280px_1fr] overflow-hidden">
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

      {/* Scraper tab */}
      {activeTab === 'scraper' && (
        <div className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto p-4">
            <ScrapeControl
              scrapeStats={data.scrapeStats}
              scrapedAt={data.scrapedAt}
              totalRaw={data.totalRaw}
              totalAfterDedup={data.totalAfterDedup}
              onScrapeComplete={loadData}
            />
          </div>
        </div>
      )}

      <footer className="border-t border-zinc-700 px-4 py-1 flex items-center justify-between flex-shrink-0">
        <span className="font-mono text-xs text-zinc-600">
          DISCLAIMER: For research purposes. Not investment advice. AI summaries via claude-sonnet-4-20250514.
        </span>
        <span className="font-mono text-xs text-zinc-600">
          Sources: DDProperty · FazWaz · Hipflat · Dot Property
        </span>
      </footer>
    </div>
  );
}
