/**
 * FazWaz scraper
 * FazWaz has a REST API used by their own frontend:
 *   https://api.fazwaz.com/api/v2/listings?...
 * Also uses Next.js with __NEXT_DATA__ on listing pages.
 * Search: https://www.fazwaz.com/condos-apartments-for-sale/thailand/bangkok
 */

import * as cheerio from 'cheerio';
import { fetchPage, fetchJSON, extractNextData, JSON_HEADERS, sleep } from './base';
import { RawListing } from './normalizer';

const SITE_URL = 'https://www.fazwaz.com';
const SEARCH_URL = `${SITE_URL}/condos-apartments-for-sale/thailand/bangkok`;

// FazWaz API (reverse-engineered from their site's network requests)
const API_BASE = 'https://www.fazwaz.com/api/v1';

interface FazWazAPIResponse {
  data?: FazWazListing[];
  listings?: FazWazListing[];
  result?: { listings?: FazWazListing[] };
  meta?: { total?: number; per_page?: number };
}

interface FazWazListing {
  id?: string | number;
  title?: string;
  title_en?: string;
  slug?: string;
  price?: number;
  price_thb?: number;
  sale_price?: number;
  size?: number;
  floor_size?: number;
  area?: number;
  bedroom?: number | null;
  bedrooms?: number;
  bathroom?: number;
  bathrooms?: number;
  district?: string | { name?: string; name_en?: string };
  district_name?: string;
  subdistrict?: string | { name?: string };
  property_type?: string;
  floor?: number;
  floors?: number;
  building_floors?: number;
  year_built?: number;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  published_at?: string;
  created_at?: string;
}

function parseFazWazListing(item: FazWazListing, idx: number): RawListing | null {
  const priceThb = item.price_thb || item.price || item.sale_price || 0;
  const areaSqm = item.floor_size || item.size || item.area || 0;
  if (!priceThb || !areaSqm) return null;

  const districtRaw = typeof item.district === 'string'
    ? item.district
    : item.district?.name_en || item.district?.name || item.district_name || '';
  const subdistrictRaw = typeof item.subdistrict === 'string'
    ? item.subdistrict
    : item.subdistrict?.name || '';

  const bedrooms = item.bedroom ?? item.bedrooms ?? 1;
  const slug = item.slug || String(item.id || idx);

  return {
    source: 'FazWaz',
    externalId: String(item.id || idx),
    url: `${SITE_URL}/condos-apartments-for-sale/thailand/bangkok/${slug}`,
    title: item.title_en || item.title || '',
    district: districtRaw,
    subdistrict: subdistrictRaw,
    priceThb,
    areaSqm,
    bedrooms: typeof bedrooms === 'number' ? bedrooms : 1,
    bathrooms: item.bathroom || item.bathrooms,
    propertyType: item.property_type || 'Condo',
    floor: item.floor,
    totalFloors: item.floors || item.building_floors,
    yearBuilt: item.year_built,
    lat: item.latitude || item.lat,
    lng: item.longitude || item.lng,
    listedAt: item.published_at || item.created_at || new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseFromNextData(data: any): RawListing[] {
  const results: RawListing[] = [];
  try {
    const listings: FazWazListing[] =
      data?.props?.pageProps?.listings ||
      data?.props?.pageProps?.data?.listings ||
      data?.props?.pageProps?.initialData?.listings ||
      [];

    listings.forEach((item, idx) => {
      const r = parseFazWazListing(item, idx);
      if (r) results.push(r);
    });
  } catch (err) {
    console.warn('[FazWaz] nextData parse error:', err);
  }
  return results;
}

async function scrapeViaAPI(page: number): Promise<RawListing[]> {
  // Try FazWaz internal API endpoints
  const endpoints = [
    `${API_BASE}/listings?country=TH&city=Bangkok&property_type=condo&listing_type=sale&page=${page}&per_page=30`,
    `${SITE_URL}/api/v1/listings?location=Bangkok&type=condo&for=sale&page=${page}`,
  ];

  for (const endpoint of endpoints) {
    const data = await fetchJSON<FazWazAPIResponse>(endpoint, {
      'Referer': SEARCH_URL,
      'Origin': SITE_URL,
    });
    if (!data) continue;

    const items: FazWazListing[] = data.data || data.listings || data.result?.listings || [];
    if (items.length > 0) {
      console.log(`[FazWaz] API page ${page}: ${items.length} listings`);
      return items.map((item, idx) => parseFazWazListing(item, idx)).filter((r): r is RawListing => r !== null);
    }
  }
  return [];
}

export async function scrapeFazWaz(maxPages = 5): Promise<RawListing[]> {
  const allListings: RawListing[] = [];

  for (let page = 1; page <= maxPages; page++) {
    // Try API first
    const apiResults = await scrapeViaAPI(page);
    if (apiResults.length > 0) {
      allListings.push(...apiResults);
      if (apiResults.length < 20) break;
      await sleep(1500 + Math.random() * 500);
      continue;
    }

    // Fallback: scrape HTML
    const pageUrl = page === 1 ? SEARCH_URL : `${SEARCH_URL}?page=${page}`;
    console.log(`[FazWaz] Fetching HTML page ${page}`);
    const { html, ok, status } = await fetchPage(pageUrl);

    if (!ok) {
      console.warn(`[FazWaz] HTTP ${status}`);
      break;
    }

    // Try __NEXT_DATA__
    const nextData = extractNextData(html);
    if (nextData) {
      const listings = parseFromNextData(nextData);
      if (listings.length > 0) {
        console.log(`[FazWaz] Page ${page}: ${listings.length} from __NEXT_DATA__`);
        allListings.push(...listings);
        if (listings.length < 10) break;
        await sleep(2000 + Math.random() * 1000);
        continue;
      }
    }

    // HTML cheerio fallback
    const $ = cheerio.load(html);
    const cards = $('[class*="listing-card"], [class*="ListingCard"], [data-listing-id], .property-item');
    console.log(`[FazWaz] Page ${page}: ${cards.length} cards from HTML`);

    cards.each((i, el) => {
      const card = $(el);
      const priceText = card.find('[class*="price"]').first().text();
      const areaText = card.find('[class*="area"], [class*="size"], [class*="sqm"]').first().text();
      const locationText = card.find('[class*="location"], [class*="district"]').first().text().trim();
      const bedText = card.find('[class*="bed"]').first().text();
      const href = card.find('a').first().attr('href') || '';

      const priceNum = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      const isM = priceText.toLowerCase().includes('m');
      const priceThb = isM ? priceNum * 1_000_000 : priceNum;
      const areaSqm = parseFloat(areaText.replace(/[^0-9.]/g, '')) || 0;
      const bedrooms = parseInt(bedText.replace(/[^0-9]/g, '')) || 1;

      if (priceThb && areaSqm) {
        allListings.push({
          source: 'FazWaz',
          externalId: `html-${page}-${i}`,
          url: href.startsWith('http') ? href : `${SITE_URL}${href}`,
          title: card.find('h2, h3, [class*="title"]').first().text().trim(),
          district: locationText,
          priceThb,
          areaSqm,
          bedrooms,
          propertyType: 'Condo',
          listedAt: new Date().toISOString(),
        });
      }
    });

    if (cards.length === 0) break;
    await sleep(2000 + Math.random() * 1000);
  }

  console.log(`[FazWaz] Total scraped: ${allListings.length}`);
  return allListings;
}
