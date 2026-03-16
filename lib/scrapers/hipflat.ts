/**
 * Hipflat scraper
 * Hipflat uses Next.js — embeds data in __NEXT_DATA__.
 * Also has a GraphQL API at https://www.hipflat.com/graphql
 * Search: https://www.hipflat.com/en/sale/condos-apartments/Bangkok--c4098/
 */

import * as cheerio from 'cheerio';
import { fetchPage, fetchJSON, extractNextData, sleep } from './base';
import { RawListing } from './normalizer';

const SITE_URL = 'https://www.hipflat.com';
const SEARCH_URL = `${SITE_URL}/en/sale/condos-apartments/Bangkok--c4098/`;
const GRAPHQL_URL = `${SITE_URL}/graphql`;

interface HipflatListing {
  id?: string | number;
  externalId?: string;
  title?: string;
  slug?: string;
  price?: number;
  priceAmount?: number;
  floorArea?: number;
  size?: number;
  bedrooms?: number;
  bedroom?: number;
  bathrooms?: number;
  bathroom?: number;
  district?: string;
  area?: string | { name?: string };
  subArea?: string | { name?: string };
  location?: { district?: { name?: string }; subdistrict?: { name?: string } };
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  latitude?: number;
  longitude?: number;
  publishedAt?: string;
  listedAt?: string;
}

interface HipflatGQLResponse {
  data?: {
    listings?: {
      edges?: Array<{ node?: HipflatListing }>;
      nodes?: HipflatListing[];
    };
    searchListings?: {
      listings?: HipflatListing[];
    };
  };
}

function parseHipflatListing(item: HipflatListing, idx: number): RawListing | null {
  const priceThb = item.priceAmount || item.price || 0;
  const areaSqm = item.floorArea || item.size || 0;
  if (!priceThb || !areaSqm) return null;

  const district =
    (typeof item.area === 'string' ? item.area : item.area?.name) ||
    item.location?.district?.name ||
    item.district || '';

  const subdistrict =
    (typeof item.subArea === 'string' ? item.subArea : item.subArea?.name) ||
    item.location?.subdistrict?.name || '';

  const bedrooms = item.bedrooms || item.bedroom || 1;
  const slug = item.slug || String(item.id || item.externalId || idx);

  return {
    source: 'Hipflat',
    externalId: String(item.id || item.externalId || idx),
    url: `${SITE_URL}/en/listings/${slug}`,
    title: item.title || '',
    district,
    subdistrict,
    priceThb,
    areaSqm,
    bedrooms,
    bathrooms: item.bathrooms || item.bathroom,
    propertyType: 'Condo',
    floor: item.floor,
    totalFloors: item.totalFloors,
    yearBuilt: item.yearBuilt,
    lat: item.latitude,
    lng: item.longitude,
    listedAt: item.publishedAt || item.listedAt || new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseFromNextData(data: any): RawListing[] {
  const results: RawListing[] = [];
  try {
    const listings: HipflatListing[] =
      data?.props?.pageProps?.listings ||
      data?.props?.pageProps?.searchResult?.listings ||
      data?.props?.pageProps?.data?.listings ||
      [];

    listings.forEach((item, idx) => {
      const r = parseHipflatListing(item, idx);
      if (r) results.push(r);
    });
  } catch (err) {
    console.warn('[Hipflat] nextData parse error:', err);
  }
  return results;
}

async function scrapeViaGraphQL(page: number): Promise<RawListing[]> {
  const offset = (page - 1) * 30;
  const query = `{
    searchListings(
      input: {
        propertyType: CONDO
        listingType: SALE
        locationIds: ["c4098"]
        limit: 30
        offset: ${offset}
      }
    ) {
      listings {
        id slug title
        priceAmount floorArea bedrooms bathrooms
        floor totalFloors yearBuilt latitude longitude publishedAt
        area { name }
        subArea { name }
      }
    }
  }`;

  const res = await fetchJSON<HipflatGQLResponse>(GRAPHQL_URL, {
    'Content-Type': 'application/json',
    'Referer': SEARCH_URL,
  });
  // Note: POST needed for GraphQL — fetchJSON uses GET, handle separately
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': SEARCH_URL,
        'Origin': SITE_URL,
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return [];
    const data: HipflatGQLResponse = await response.json();
    const listings = data?.data?.searchListings?.listings || [];
    return listings.map((item, idx) => parseHipflatListing(item, idx)).filter((r): r is RawListing => r !== null);
  } catch {
    return [];
  }
}

export async function scrapeHipflat(maxPages = 5): Promise<RawListing[]> {
  const allListings: RawListing[] = [];

  for (let page = 1; page <= maxPages; page++) {
    // Try GraphQL API first
    const gqlResults = await scrapeViaGraphQL(page);
    if (gqlResults.length > 0) {
      console.log(`[Hipflat] GraphQL page ${page}: ${gqlResults.length}`);
      allListings.push(...gqlResults);
      if (gqlResults.length < 20) break;
      await sleep(1000 + Math.random() * 500);
      continue;
    }

    // Fallback: HTML + __NEXT_DATA__
    const pageUrl = page === 1 ? SEARCH_URL : `${SEARCH_URL}?page=${page}`;
    console.log(`[Hipflat] Fetching HTML page ${page}`);
    const { html, ok, status } = await fetchPage(pageUrl);

    if (!ok) {
      console.warn(`[Hipflat] HTTP ${status}`);
      break;
    }

    const nextData = extractNextData(html);
    if (nextData) {
      const listings = parseFromNextData(nextData);
      if (listings.length > 0) {
        console.log(`[Hipflat] Page ${page}: ${listings.length} from __NEXT_DATA__`);
        allListings.push(...listings);
        if (listings.length < 10) break;
        await sleep(2000 + Math.random() * 1000);
        continue;
      }
    }

    // HTML fallback
    const $ = cheerio.load(html);
    const cards = $('[class*="listing"], [class*="property"], [data-id]').filter((_, el) => {
      return $(el).find('a').length > 0 && $(el).find('[class*="price"]').length > 0;
    });

    console.log(`[Hipflat] Page ${page}: ${cards.length} cards from HTML`);
    cards.each((i, el) => {
      const card = $(el);
      const priceText = card.find('[class*="price"]').first().text();
      const areaText = card.find('[class*="area"], [class*="sqm"]').first().text();
      const locationText = card.find('[class*="location"], [class*="area"]').last().text().trim();
      const bedText = card.find('[class*="bed"]').first().text();
      const href = card.find('a').first().attr('href') || '';

      const priceNum = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      const isM = priceText.toLowerCase().includes('m');
      const priceThb = isM ? priceNum * 1_000_000 : priceNum;
      const areaSqm = parseFloat(areaText.replace(/[^0-9.]/g, '')) || 0;
      const bedrooms = parseInt(bedText.replace(/[^0-9]/g, '')) || 1;

      if (priceThb && areaSqm) {
        allListings.push({
          source: 'Hipflat',
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

  console.log(`[Hipflat] Total scraped: ${allListings.length}`);
  return allListings;
}
