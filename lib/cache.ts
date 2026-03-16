/**
 * File-based cache for scraped property data.
 * Stores listings as JSON to avoid re-scraping on every request.
 * Falls back to mock data if cache is empty or stale.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { PropertyListing } from '@/types/property';
import { ScrapeResult } from './scrapers/index';

const CACHE_DIR = join(process.cwd(), 'data');
const CACHE_FILE = join(CACHE_DIR, 'listings.json');
const STALE_HOURS = 36; // PRD: show staleness indicator after 36 hours

export interface CachedData {
  listings: PropertyListing[];
  scrapedAt: string;
  sourceStats: ScrapeResult['sourceStats'];
  totalRaw: number;
  totalNormalized: number;
  totalAfterDedup: number;
}

function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

export function readCache(): CachedData | null {
  try {
    if (!existsSync(CACHE_FILE)) return null;
    const raw = readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(raw) as CachedData;
  } catch {
    return null;
  }
}

export function writeCache(data: CachedData): void {
  ensureCacheDir();
  writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function isCacheStale(cache: CachedData): boolean {
  const ageMs = Date.now() - new Date(cache.scrapedAt).getTime();
  return ageMs > STALE_HOURS * 3600 * 1000;
}

export function getCacheAge(cache: CachedData): string {
  const ageMs = Date.now() - new Date(cache.scrapedAt).getTime();
  const hours = Math.floor(ageMs / 3600000);
  const mins = Math.floor((ageMs % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${mins}m ago`;
  return `${mins}m ago`;
}
