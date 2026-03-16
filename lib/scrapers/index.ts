import { scrapeDDProperty } from './ddproperty';
import { scrapeFazWaz } from './fazwaz';
import { scrapeHipflat } from './hipflat';
import { scrapeDotProperty } from './dotproperty';
import { normalizeToListing, deduplicateListings, tagAnomalies, RawListing } from './normalizer';
import { PropertyListing, Source } from '@/types/property';

export interface ScrapeResult {
  listings: PropertyListing[];
  sourceStats: {
    source: Source;
    scraped: number;
    normalized: number;
    status: 'success' | 'partial' | 'failed';
    error?: string;
  }[];
  scrapedAt: string;
  totalRaw: number;
  totalNormalized: number;
  totalAfterDedup: number;
}

export async function runAllScrapers(maxPagesPerSource = 5): Promise<ScrapeResult> {
  const scrapedAt = new Date().toISOString();
  const sourceStats: ScrapeResult['sourceStats'] = [];
  const allRaw: RawListing[] = [];

  // Run scrapers with individual error handling
  const scrapers: Array<{ source: Source; fn: () => Promise<RawListing[]> }> = [
    { source: 'DDProperty', fn: () => scrapeDDProperty(maxPagesPerSource) },
    { source: 'FazWaz', fn: () => scrapeFazWaz(maxPagesPerSource) },
    { source: 'Hipflat', fn: () => scrapeHipflat(maxPagesPerSource) },
    { source: 'DotProperty', fn: () => scrapeDotProperty(maxPagesPerSource) },
  ];

  for (const { source, fn } of scrapers) {
    try {
      const raw = await fn();
      allRaw.push(...raw);
      sourceStats.push({
        source,
        scraped: raw.length,
        normalized: 0, // filled below
        status: raw.length > 0 ? 'success' : 'partial',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Scraper] ${source} failed:`, msg);
      sourceStats.push({
        source,
        scraped: 0,
        normalized: 0,
        status: 'failed',
        error: msg,
      });
    }
  }

  // Normalize
  const normalized: PropertyListing[] = [];
  allRaw.forEach((raw, idx) => {
    const listing = normalizeToListing(raw, idx);
    if (listing) {
      normalized.push(listing);
      // Update sourceStats normalized count
      const stat = sourceStats.find(s => s.source === raw.source);
      if (stat) stat.normalized++;
    }
  });

  // Deduplicate across sources
  const deduped = deduplicateListings(normalized);

  // Tag anomalies
  const final = tagAnomalies(deduped);

  return {
    listings: final,
    sourceStats,
    scrapedAt,
    totalRaw: allRaw.length,
    totalNormalized: normalized.length,
    totalAfterDedup: final.length,
  };
}
