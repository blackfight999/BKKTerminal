/**
 * Dot Property scraper
 * Dot Property (dotproperty.co.th) uses WordPress + custom JS.
 * They have a REST API endpoint and Next.js on some pages.
 * Search: https://www.dotproperty.co.th/properties-for-sale/bangkok/condos
 * API: https://www.dotproperty.co.th/api/search?...
 */

import * as cheerio from 'cheerio';
import { fetchPage, fetchJSON, extractNextData, sleep } from './base';
import { RawListing } from './normalizer';

const SITE_URL = 'https://www.dotproperty.co.th';
const SEARCH_URL = `${SITE_URL}/properties-for-sale/bangkok/condos`;
const API_URL = `${SITE_URL}/api/v1/search`;

interface DotPropertyListing {
  id?: string | number;
  property_id?: string | number;
  title?: string;
  slug?: string;
  price?: number | string;
  sale_price?: number;
  size?: number | string;
  floor_size?: number;
  bedroom?: number | string;
  bedrooms?: number;
  bathroom?: number;
  bathrooms?: number;
  location?: string;
  district?: string;
  area?: string;
  property_area?: string;
  latitude?: number;
  longitude?: number;
  floor?: number;
  total_floors?: number;
  year_built?: number;
  date_created?: string;
  published_at?: string;
}

interface DotPropertyAPIResponse {
  data?: DotPropertyListing[];
  properties?: DotPropertyListing[];
  listings?: DotPropertyListing[];
  results?: DotPropertyListing[];
  total?: number;
}

function parseDotPropertyListing(item: DotPropertyListing, idx: number): RawListing | null {
  const priceRaw = item.sale_price || item.price;
  const priceThb = typeof priceRaw === 'string'
    ? parseFloat(priceRaw.replace(/[^0-9.]/g, ''))
    : (priceRaw || 0);

  const areaRaw = item.floor_size || item.size;
  const areaSqm = typeof areaRaw === 'string'
    ? parseFloat(areaRaw.replace(/[^0-9.]/g, ''))
    : (areaRaw || 0);

  if (!priceThb || !areaSqm) return null;

  const bedroomRaw = item.bedrooms || item.bedroom;
  const bedrooms = typeof bedroomRaw === 'string' ? parseInt(bedroomRaw) || 1 : (bedroomRaw || 1);

  const district = item.district || item.area || item.property_area || item.location || '';
  const slug = item.slug || String(item.id || item.property_id || idx);

  return {
    source: 'DotProperty',
    externalId: String(item.id || item.property_id || idx),
    url: `${SITE_URL}/property/${slug}`,
    title: item.title || '',
    district,
    priceThb,
    areaSqm,
    bedrooms,
    bathrooms: item.bathrooms || item.bathroom,
    propertyType: 'Condo',
    floor: item.floor,
    totalFloors: item.total_floors,
    yearBuilt: item.year_built,
    lat: item.latitude,
    lng: item.longitude,
    listedAt: item.published_at || item.date_created || new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseFromNextData(data: any): RawListing[] {
  const results: RawListing[] = [];
  try {
    const listings: DotPropertyListing[] =
      data?.props?.pageProps?.properties ||
      data?.props?.pageProps?.listings ||
      data?.props?.pageProps?.data?.properties ||
      [];

    listings.forEach((item, idx) => {
      const r = parseDotPropertyListing(item, idx);
      if (r) results.push(r);
    });
  } catch (err) {
    console.warn('[DotProperty] nextData parse error:', err);
  }
  return results;
}

async function scrapeViaAPI(page: number): Promise<RawListing[]> {
  const params = new URLSearchParams({
    location: 'bangkok',
    property_type: 'condo',
    listing_type: 'sale',
    page: String(page),
    per_page: '30',
    country: 'TH',
  });

  const endpoints = [
    `${API_URL}?${params}`,
    `${SITE_URL}/api/properties?location=bangkok&type=condo&for=sale&page=${page}`,
    `${SITE_URL}/wp-json/wp/v2/property?location=bangkok&category=condo&per_page=30&page=${page}`,
  ];

  for (const endpoint of endpoints) {
    const data = await fetchJSON<DotPropertyAPIResponse>(endpoint, {
      'Referer': SEARCH_URL,
    });
    if (!data) continue;

    const items: DotPropertyListing[] = data.data || data.properties || data.listings || data.results || [];
    if (items.length > 0) {
      console.log(`[DotProperty] API page ${page}: ${items.length}`);
      return items.map((item, idx) => parseDotPropertyListing(item, idx)).filter((r): r is RawListing => r !== null);
    }
  }
  return [];
}

export async function scrapeDotProperty(maxPages = 5): Promise<RawListing[]> {
  const allListings: RawListing[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const apiResults = await scrapeViaAPI(page);
    if (apiResults.length > 0) {
      allListings.push(...apiResults);
      if (apiResults.length < 20) break;
      await sleep(1500 + Math.random() * 500);
      continue;
    }

    // HTML fallback
    const pageUrl = page === 1 ? SEARCH_URL : `${SEARCH_URL}?page=${page}`;
    console.log(`[DotProperty] Fetching HTML page ${page}`);
    const { html, ok, status } = await fetchPage(pageUrl);

    if (!ok) {
      console.warn(`[DotProperty] HTTP ${status}`);
      break;
    }

    const nextData = extractNextData(html);
    if (nextData) {
      const listings = parseFromNextData(nextData);
      if (listings.length > 0) {
        console.log(`[DotProperty] Page ${page}: ${listings.length} from __NEXT_DATA__`);
        allListings.push(...listings);
        if (listings.length < 10) break;
        await sleep(2000 + Math.random() * 1000);
        continue;
      }
    }

    // HTML cheerio
    const $ = cheerio.load(html);

    // DotProperty uses class patterns like "property-list-item", "listing-card"
    const cards = $(
      '.property-list-item, .listing-card, [class*="PropertyCard"], [class*="property-card"], article[class*="property"]'
    );

    console.log(`[DotProperty] Page ${page}: ${cards.length} cards from HTML`);

    cards.each((i, el) => {
      const card = $(el);

      // Price: look for THB or ฿ or "Bath"
      const priceEl = card.find('[class*="price"], .price, [itemprop="price"]').first();
      const priceText = priceEl.text() || priceEl.attr('content') || '';
      const priceNum = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      const isM = priceText.toLowerCase().includes('m') || priceText.includes('ล้าน');
      const priceThb = isM ? priceNum * 1_000_000 : priceNum;

      // Area
      const areaText = card.find('[class*="floor-area"], [class*="size"], [class*="sqm"], [class*="area"]').first().text();
      const areaSqm = parseFloat(areaText.replace(/[^0-9.]/g, '')) || 0;

      // District / location
      const locationText = card
        .find('[class*="location"], [class*="district"], [class*="area-name"], address')
        .first()
        .text()
        .trim();

      // Bedrooms
      const bedText = card.find('[class*="bed"], [class*="bedroom"]').first().text();
      const bedrooms = parseInt(bedText.replace(/[^0-9]/g, '')) || 1;

      const href = card.find('a').first().attr('href') || '';
      const title = card.find('h2, h3, [class*="title"], [itemprop="name"]').first().text().trim();

      if (priceThb && areaSqm) {
        allListings.push({
          source: 'DotProperty',
          externalId: `html-${page}-${i}`,
          url: href.startsWith('http') ? href : `${SITE_URL}${href}`,
          title,
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

  console.log(`[DotProperty] Total scraped: ${allListings.length}`);
  return allListings;
}
