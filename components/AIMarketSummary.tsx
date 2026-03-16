'use client';

import { useState } from 'react';
import { Bot, RefreshCw, AlertCircle } from 'lucide-react';
import { ZoneSummary } from '@/types/property';

interface AIMarketSummaryProps {
  selectedZone: string | null;
  zoneSummary: ZoneSummary | null;
}

interface SummaryResult {
  summary: string;
  zone: string;
  generatedAt: string;
  model?: string;
  insufficient?: boolean;
  error?: boolean;
}

export default function AIMarketSummary({ selectedZone, zoneSummary }: AIMarketSummaryProps) {
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastFetchedZone, setLastFetchedZone] = useState<string | null>(null);

  async function fetchSummary(zone: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone }),
      });
      const data = await res.json();
      setResult(data);
      setLastFetchedZone(zone);
    } catch {
      setResult({
        summary: 'Summary unavailable — data error. Please try again later.',
        zone,
        generatedAt: new Date().toISOString(),
        error: true,
      });
    } finally {
      setLoading(false);
    }
  }

  const showRefresh = selectedZone && selectedZone !== lastFetchedZone;

  return (
    <div className="bg-zinc-900 border border-zinc-700 flex flex-col">
      <div className="px-3 py-2 border-b border-zinc-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={12} className="text-purple-400" />
          <span className="text-purple-400 font-mono text-xs font-bold tracking-wider">AI MARKET SUMMARY</span>
          {result?.model && !result.error && (
            <span className="text-zinc-600 font-mono text-xs">· {result.model}</span>
          )}
        </div>
        {selectedZone && (
          <button
            onClick={() => fetchSummary(selectedZone)}
            disabled={loading}
            className="flex items-center gap-1 font-mono text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-50 border border-zinc-700 px-2 py-0.5 hover:border-zinc-500"
          >
            <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
            {loading ? 'GENERATING...' : showRefresh ? `ANALYZE ${selectedZone.toUpperCase()}` : 'REFRESH'}
          </button>
        )}
      </div>

      <div className="px-3 py-3 min-h-[80px]">
        {!selectedZone && (
          <p className="text-zinc-600 font-mono text-xs">
            Select a zone from the table or chart to generate an AI market summary.
          </p>
        )}

        {selectedZone && !result && !loading && (
          <div className="flex items-center gap-2">
            <p className="text-zinc-500 font-mono text-xs">
              Ready to analyze <span className="text-zinc-300">{selectedZone}</span>
              {zoneSummary && ` — ${zoneSummary.listingCount} active listings`}.
            </p>
            <button
              onClick={() => fetchSummary(selectedZone)}
              className="text-purple-400 font-mono text-xs hover:text-purple-300 underline"
            >
              Generate summary →
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs">
            <RefreshCw size={10} className="animate-spin" />
            Analyzing {selectedZone} market data...
          </div>
        )}

        {result && !loading && (
          <div className="space-y-2">
            {result.insufficient ? (
              <div className="flex items-start gap-2 text-zinc-500 font-mono text-xs">
                <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                <span>{result.summary}</span>
              </div>
            ) : result.error ? (
              <div className="flex items-start gap-2 text-red-400 font-mono text-xs">
                <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                <span>{result.summary}</span>
              </div>
            ) : (
              <p className="text-zinc-300 font-mono text-xs leading-relaxed">{result.summary}</p>
            )}
            <p className="text-zinc-600 font-mono text-xs">
              AI Summary — Generated {new Date(result.generatedAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' })} ICT
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
