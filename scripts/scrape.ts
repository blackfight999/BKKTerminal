#!/usr/bin/env tsx
/**
 * Standalone scraper script — run directly or via cron
 * Usage: npx tsx scripts/scrape.ts
 * Cron:  0 2 * * * cd /app && npx tsx scripts/scrape.ts >> /var/log/bkk-scrape.log 2>&1
 */

import { runAllScrapers } from '../lib/scrapers/index';
import { writeCache } from '../lib/cache';

async function main() {
  console.log(`[${new Date().toISOString()}] BKK Terminal scraper starting...`);

  const MAX_PAGES = parseInt(process.env.MAX_PAGES ?? '5');
  console.log(`Config: maxPages=${MAX_PAGES}`);

  try {
    const result = await runAllScrapers(MAX_PAGES);

    console.log('\n=== SCRAPE RESULTS ===');
    console.log(`Total raw:        ${result.totalRaw}`);
    console.log(`Total normalized: ${result.totalNormalized}`);
    console.log(`After dedup:      ${result.totalAfterDedup}`);
    console.log('\nPer source:');
    result.sourceStats.forEach(s => {
      const icon = s.status === 'success' ? '✓' : s.status === 'partial' ? '~' : '✗';
      console.log(`  ${icon} ${s.source.padEnd(12)} scraped=${s.scraped} normalized=${s.normalized} [${s.status}]${s.error ? ` — ${s.error}` : ''}`);
    });

    if (result.listings.length > 0) {
      writeCache({
        listings: result.listings,
        scrapedAt: result.scrapedAt,
        sourceStats: result.sourceStats,
        totalRaw: result.totalRaw,
        totalNormalized: result.totalNormalized,
        totalAfterDedup: result.totalAfterDedup,
      });
      console.log(`\n✓ Cache written to data/listings.json`);
    } else {
      console.warn('\n⚠ No listings scraped — keeping existing cache');
      process.exit(1);
    }
  } catch (err) {
    console.error(`\n✗ Scrape failed:`, err);
    process.exit(1);
  }

  console.log(`\n[${new Date().toISOString()}] Done.`);
}

main();
