'use client';

import { useState } from 'react';
import { Play, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface ScrapeStats {
  source: string;
  scraped: number;
  normalized: number;
  status: 'success' | 'partial' | 'failed';
  error?: string;
}

interface ScrapeControlProps {
  scrapeStats?: ScrapeStats[];
  scrapedAt?: string | null;
  totalRaw?: number;
  totalAfterDedup?: number;
  onScrapeComplete?: () => void;
}

interface ScrapeResponse {
  success?: boolean;
  error?: string;
  scrapedAt?: string;
  totalListings?: number;
  totalRaw?: number;
  totalNormalized?: number;
  totalAfterDedup?: number;
  sourceStats?: ScrapeStats[];
}

export default function ScrapeControl({ scrapeStats, scrapedAt, totalRaw, totalAfterDedup, onScrapeComplete }: ScrapeControlProps) {
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<ScrapeResponse | null>(null);
  const [log, setLog] = useState<string[]>([]);

  async function triggerScrape() {
    setRunning(true);
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Starting scrape of all 4 sources...`]);

    try {
      const res = await fetch('/api/scrape', { method: 'POST' });
      const data: ScrapeResponse = await res.json();

      if (data.success) {
        setLog(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Scrape complete.`,
          `  Raw: ${data.totalRaw} | Normalized: ${data.totalNormalized} | After dedup: ${data.totalAfterDedup}`,
          ...(data.sourceStats ?? []).map(s =>
            `  ${s.source}: ${s.scraped} scraped → ${s.normalized} normalized [${s.status.toUpperCase()}]${s.error ? ` — ${s.error}` : ''}`
          ),
        ]);
        setLastResult(data);
        onScrapeComplete?.();
      } else {
        setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ERROR: ${data.error}`]);
      }
    } catch (err) {
      setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] FAILED: ${err}`]);
    } finally {
      setRunning(false);
    }
  }

  const displayStats = lastResult?.sourceStats ?? scrapeStats;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border border-zinc-700 bg-zinc-900 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-amber-400 font-mono text-sm font-bold tracking-wider">SCRAPER CONTROL</div>
            <div className="text-zinc-500 font-mono text-xs mt-0.5">
              Pulls from DDProperty · FazWaz · Hipflat · Dot Property — Bangkok condos, sale listings
            </div>
          </div>
          <button
            onClick={triggerScrape}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-zinc-900 font-mono text-xs font-bold hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
            {running ? 'SCRAPING...' : 'RUN SCRAPER'}
          </button>
        </div>

        {/* Last scrape summary */}
        {scrapedAt && (
          <div className="font-mono text-xs text-zinc-500 border-t border-zinc-700 pt-2 mt-2 flex gap-6">
            <span>Last scraped: <span className="text-zinc-300">{new Date(scrapedAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' })} ICT</span></span>
            {totalRaw !== undefined && <span>Raw: <span className="text-zinc-300">{totalRaw}</span></span>}
            {totalAfterDedup !== undefined && <span>After dedup: <span className="text-zinc-300">{totalAfterDedup}</span></span>}
          </div>
        )}
      </div>

      {/* Source stats table */}
      {displayStats && displayStats.length > 0 && (
        <div className="border border-zinc-700 bg-zinc-900">
          <div className="px-3 py-2 border-b border-zinc-700 text-amber-400 font-mono text-xs font-bold tracking-wider">
            SOURCE STATUS
          </div>
          <table className="w-full font-mono text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="text-left px-3 py-1.5 font-normal">SOURCE</th>
                <th className="text-right px-3 py-1.5 font-normal">SCRAPED</th>
                <th className="text-right px-3 py-1.5 font-normal">NORMALIZED</th>
                <th className="text-right px-3 py-1.5 font-normal">STATUS</th>
                <th className="text-left px-3 py-1.5 font-normal">ERROR</th>
              </tr>
            </thead>
            <tbody>
              {displayStats.map(s => (
                <tr key={s.source} className="border-b border-zinc-800/40">
                  <td className="px-3 py-1.5 text-zinc-200">{s.source}</td>
                  <td className="text-right px-3 py-1.5 text-zinc-400">{s.scraped}</td>
                  <td className="text-right px-3 py-1.5 text-zinc-400">{s.normalized}</td>
                  <td className="text-right px-3 py-1.5">
                    {s.status === 'success' && <span className="flex items-center justify-end gap-1 text-green-400"><CheckCircle size={10} /> OK</span>}
                    {s.status === 'partial' && <span className="flex items-center justify-end gap-1 text-amber-400"><AlertCircle size={10} /> PARTIAL</span>}
                    {s.status === 'failed' && <span className="flex items-center justify-end gap-1 text-red-400"><XCircle size={10} /> FAILED</span>}
                  </td>
                  <td className="px-3 py-1.5 text-red-400 text-xs">{s.error || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Log output */}
      {log.length > 0 && (
        <div className="border border-zinc-700 bg-zinc-950">
          <div className="px-3 py-1.5 border-b border-zinc-700 text-zinc-500 font-mono text-xs">SCRAPE LOG</div>
          <div className="p-3 font-mono text-xs text-zinc-400 space-y-0.5 max-h-64 overflow-auto">
            {log.map((line, i) => (
              <div key={i} className="whitespace-pre">{line}</div>
            ))}
            {running && <div className="text-amber-400 animate-pulse">▌</div>}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-500 space-y-1">
        <p>• Scraper uses HTTP fetch with browser-like headers. Sites behind Cloudflare JS challenge may return partial data.</p>
        <p>• Data is cached to <code className="text-zinc-300">data/listings.json</code> and served until next scrape.</p>
        <p>• Deduplication: listings within ±2 sqm area and ±3% price across sources are merged.</p>
        <p>• Production: schedule via cron at 02:00 ICT daily. Scrape window: 2h. Last valid dataset served as fallback.</p>
        <p>• robots.txt compliant. Crawl rate: ~1.5–2s between requests per source.</p>
      </div>
    </div>
  );
}
