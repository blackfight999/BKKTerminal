import { NextResponse } from 'next/server';
import { readCache, isCacheStale, getCacheAge } from '@/lib/cache';
import { getZoneSummariesFromListings, getSourceStatsFromListings, getAnomaliesFromListings } from '@/lib/dataUtils';

export async function GET() {
  const cache = readCache();

  if (!cache || cache.listings.length === 0) {
    return NextResponse.json({
      source: 'none',
      listings: [],
      zoneSummaries: [],
      sourceStats: [],
      anomalies: [],
      scrapedAt: null,
      isStale: true,
      cacheAge: null,
    });
  }

  const stale = isCacheStale(cache);
  const age = getCacheAge(cache);

  return NextResponse.json({
    source: 'scraped',
    listings: cache.listings,
    zoneSummaries: getZoneSummariesFromListings(cache.listings),
    sourceStats: getSourceStatsFromListings(cache.listings, cache.scrapedAt),
    anomalies: getAnomaliesFromListings(cache.listings),
    scrapedAt: cache.scrapedAt,
    isStale: stale,
    cacheAge: age,
    totalRaw: cache.totalRaw,
    totalAfterDedup: cache.totalAfterDedup,
    scrapeStats: cache.sourceStats,
  });
}
