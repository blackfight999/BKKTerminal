/**
 * DDProperty scraper
 * DDProperty uses Next.js — listings are embedded in __NEXT_DATA__ JSON.
 * Search API: https://www.ddproperty.com/en/property-for-sale
 *   ?region_code=TH10         (Bangkok)
 *   &property_type_code[]=APP (Apartment/Condo)
 *   &listing_type=sale
 *   &page=N
 */

import * as cheerio from 'cheerio';
import { AnyNode } from 'domhandler';
import { fetchPage, extractNextData, sleep } from './base';
import { RawListing } from './normalizer';

const BASE_URL = 'https://www.ddproperty.com';
const SEARCH_URL = `${BASE_URL}/en/property-for-sale?region_code=TH10&property_type_code[]=APP&listing_type=sale`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseListingFromCard($: cheerio.CheerioAPI, el: AnyNode): RawListing | null {
  const card = $(el);
  try {
    // Price
    const priceText = card.find('[data-cy="price"], .listing-card-price, .property-price').first().text().trim();
    const priceNum = parseFloat(priceText.replace(/[^0-9.]/g, ''));
    const isMillions = priceText.toLowerCase().includes('m') || priceText.includes('ล้าน');
    const priceThb = isMillions ? priceNum * 1_000_000 : priceNum;

    // Area
    const areaText = card.find('[data-cy="floorarea"], .listing-floorarea, .area').first().text();
    const areaSqm = parseFloat(areaText.replace(/[^0-9.]/g, '')) || 0;

    // Bedrooms
    const bedText = card.find('[data-cy="bedroom"], .listing-bedroom, .bedroom').first().text();
    const bedrooms = parseInt(bedText.replace(/[^0-9]/g, '')) || 1;

    // Location
    const locationText = card.find('[data-cy="location-name"], .listing-location, .location').first().text().trim();

    // URL / ID
    const href = card.find('a').first().attr('href') || '';
    const externalId = href.split('/').pop()?.split('?')[0] || '';

    // Title
    const title = card.find('[data-cy="listing-title"], .listing-title, h3, h2').first().text().trim();

    if (!priceThb || !areaSqm) return null;

    return {
      source: 'DDProperty',
      externalId,
      url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
      title,
      district: locationText,
      priceThb,
      areaSqm,
      bedrooms,
      propertyType: 'Condo',
      listedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// Parse from __NEXT_DATA__ JSON (primary strategy)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseFromNextData(data: any): RawListing[] {
  const results: RawListing[] = [];
  try {
    // DDProperty embeds listings under props.pageProps.listingData or similar
    const listings =
      data?.props?.pageProps?.listingData?.listings ||
      data?.props?.pageProps?.listings ||
      data?.props?.pageProps?.data?.listings ||
      [];

    for (const item of listings) {
      try {
        const priceThb = item.attributes?.price?.value || item.price?.value || item.price || 0;
        const areaSqm = item.attributes?.floor_size?.value || item.floor_size || item.area || 0;
        const bedrooms = item.attributes?.bedroom || item.bedroom || item.bedrooms || 1;
        const district = item.location?.district?.name || item.district?.name || item.area_name || item.location || '';
        const subdistrict = item.location?.subdistrict?.name || item.subdistrict?.name || '';
        const title = item.title || item.name || '';
        const externalId = String(item.id || item.listing_id || '');
        const lat = item.location?.lat || item.lat || 0;
        const lng = item.location?.lng || item.lng || 0;
        const floor = item.attributes?.floor || item.floor;
        const totalFloors = item.attributes?.total_floors || item.total_floors;
        const yearBuilt = item.attributes?.year_built || item.year_built;
        const listedAt = item.created_at || item.listed_at || new Date().toISOString();
        const slug = item.slug || item.url || externalId;

        if (!priceThb || !areaSqm) continue;

        results.push({
          source: 'DDProperty',
          externalId,
          url: `${BASE_URL}/en/property/${slug}`,
          title,
          district,
          subdistrict,
          priceThb,
          areaSqm,
          bedrooms,
          propertyType: 'Condo',
          floor,
          totalFloors,
          yearBuilt,
          lat,
          lng,
          listedAt,
        });
      } catch {
        continue;
      }
    }
  } catch (err) {
    console.warn('[DDProperty] nextData parse error:', err);
  }
  return results;
}

export async function scrapeDDProperty(maxPages = 5): Promise<RawListing[]> {
  const allListings: RawListing[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const url = `${SEARCH_URL}&page=${page}`;
    console.log(`[DDProperty] Fetching page ${page}: ${url}`);

    const { html, ok, status } = await fetchPage(url);

    if (!ok) {
      console.warn(`[DDProperty] HTTP ${status} on page ${page}`);
      break;
    }

    // Strategy 1: Extract from __NEXT_DATA__
    const nextData = extractNextData(html);
    if (nextData) {
      const listings = parseFromNextData(nextData);
      if (listings.length > 0) {
        console.log(`[DDProperty] Page ${page}: ${listings.length} listings from __NEXT_DATA__`);
        allListings.push(...listings);
        if (listings.length < 10) break; // last page
        await sleep(1500 + Math.random() * 1000);
        continue;
      }
    }

    // Strategy 2: Parse HTML with cheerio
    const $ = cheerio.load(html);
    const cards = $('[data-cy="listing-card"], .listing-card, .property-card, [class*="ListingCard"]');
    console.log(`[DDProperty] Page ${page}: ${cards.length} cards from HTML`);

    cards.each((_, el) => {
      const listing = parseListingFromCard($, el);
      if (listing) allListings.push(listing);
    });

    if (cards.length === 0) {
      console.warn(`[DDProperty] No cards found on page ${page} — possible bot block`);
      break;
    }

    await sleep(2000 + Math.random() * 1000);
  }

  console.log(`[DDProperty] Total scraped: ${allListings.length}`);
  return allListings;
}
