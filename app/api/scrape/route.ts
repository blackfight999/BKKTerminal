import { NextResponse } from 'next/server';
import { runAllScrapers } from '@/lib/scrapers/index';
import { writeCache, readCache } from '@/lib/cache';


// Global lock to prevent concurrent scrapes
let scraping = false;

export async function POST() {
  if (scraping) {
    return NextResponse.json({ error: 'Scrape already in progress' }, { status: 429 });
  }

  scraping = true;
  try {
    console.log('[API/scrape] Starting scrape...');
    const result = await runAllScrapers(5);

    const cache = {
      listings: result.listings,
      scrapedAt: result.scrapedAt,
      sourceStats: result.sourceStats,
      totalRaw: result.totalRaw,
      totalNormalized: result.totalNormalized,
      totalAfterDedup: result.totalAfterDedup,
    };
    writeCache(cache);

    return NextResponse.json({
      success: true,
      scrapedAt: result.scrapedAt,
      totalListings: result.listings.length,
      totalRaw: result.totalRaw,
      totalNormalized: result.totalNormalized,
      totalAfterDedup: result.totalAfterDedup,
      sourceStats: result.sourceStats,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[API/scrape] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    scraping = false;
  }
}

export async function GET() {
  const cache = readCache();
  if (!cache) {
    return NextResponse.json({ status: 'no_data', message: 'No scraped data yet. POST to trigger a scrape.' });
  }
  return NextResponse.json({
    status: 'ok',
    scrapedAt: cache.scrapedAt,
    totalListings: cache.listings.length,
    sourceStats: cache.sourceStats,
  });
}
