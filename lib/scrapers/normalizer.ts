import { PropertyListing, Source } from '@/types/property';

export interface RawListing {
  source: Source;
  externalId: string;
  url: string;
  title: string;
  district: string;       // raw district/area name
  subdistrict?: string;
  priceThb: number;
  areaSqm: number;
  bedrooms: number;
  bathrooms?: number;
  propertyType: string;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  lat?: number;
  lng?: number;
  listedAt?: string;
  rawData?: Record<string, unknown>;
}

// Map various district name spellings to canonical zone names
const ZONE_MAP: Record<string, string> = {
  // Thonglor / Thong Lo
  'thonglor': 'Thonglor', 'thong lo': 'Thonglor', 'thong lor': 'Thonglor',
  'sukhumvit 55': 'Thonglor', 'sukhumvit soi 55': 'Thonglor',
  // Ekkamai
  'ekkamai': 'Ekkamai', 'sukhumvit 63': 'Ekkamai', 'sukhumvit soi 63': 'Ekkamai',
  // Asok
  'asok': 'Asok', 'asoke': 'Asok', 'sukhumvit 21': 'Asok', 'sukhumvit soi 21': 'Asok',
  'nana': 'Asok',
  // Phrom Phong
  'phrom phong': 'Phrom Phong', 'prompong': 'Phrom Phong', 'phrompong': 'Phrom Phong',
  'sukhumvit 39': 'Phrom Phong', 'sukhumvit soi 39': 'Phrom Phong',
  // Silom
  'silom': 'Silom', 'sathorn': 'Silom', 'sathon': 'Silom', 'bangrak': 'Silom',
  'sala daeng': 'Silom', 'chong nonsi': 'Silom',
  // Ari
  'ari': 'Ari', 'phahon yothin': 'Ari', 'phahonyothin': 'Ari', 'sanam pao': 'Ari',
  'victory monument': 'Ari',
  // Ratchada
  'ratchada': 'Ratchada', 'ratchadaphisek': 'Ratchada', 'ratchada lat phrao': 'Ratchada',
  'huai khwang': 'Ratchada', 'huay kwang': 'Ratchada', 'thailand cultural centre': 'Ratchada',
  // On Nut
  'on nut': 'On Nut', 'onnut': 'On Nut', 'sukhumvit 77': 'On Nut',
  'sukhumvit soi 77': 'On Nut',
  // Phra Khanong
  'phra khanong': 'Phra Khanong', 'phrakhanong': 'Phra Khanong',
  'bang chak': 'Phra Khanong', 'bangchak': 'Phra Khanong',
  // Lad Phrao
  'lad phrao': 'Lad Phrao', 'ladphrao': 'Lad Phrao', 'lat phrao': 'Lad Phrao',
  'chatuchak': 'Lad Phrao', 'mo chit': 'Lad Phrao',
};

export function normalizeZone(raw: string): string {
  const lower = raw.toLowerCase().trim();
  // Direct match
  if (ZONE_MAP[lower]) return ZONE_MAP[lower];
  // Partial match
  for (const [key, zone] of Object.entries(ZONE_MAP)) {
    if (lower.includes(key)) return zone;
  }
  return raw; // return as-is if no match
}

export function normalizeToListing(raw: RawListing, idx: number): PropertyListing | null {
  if (!raw.priceThb || !raw.areaSqm || raw.areaSqm < 1) return null;
  if (raw.priceThb < 500_000 || raw.priceThb > 500_000_000) return null; // sanity bounds

  const pricePerSqm = Math.round(raw.priceThb / raw.areaSqm);
  if (pricePerSqm < 20_000 || pricePerSqm > 800_000) return null; // sanity bounds

  const zone = normalizeZone(raw.district);

  return {
    id: `${raw.source.slice(0, 2).toUpperCase()}${String(idx).padStart(5, '0')}`,
    source: raw.source,
    title: raw.title || `${raw.bedrooms}BR Condo ${raw.district}`,
    zone,
    subzone: raw.subdistrict || raw.district,
    type: 'Condo',
    listingType: 'Sale',
    price: raw.priceThb,
    area: raw.areaSqm,
    pricePerSqm,
    bedrooms: raw.bedrooms || 1,
    bathrooms: raw.bathrooms || raw.bedrooms || 1,
    floor: raw.floor,
    totalFloors: raw.totalFloors,
    yearBuilt: raw.yearBuilt,
    daysOnMarket: raw.listedAt
      ? Math.floor((Date.now() - new Date(raw.listedAt).getTime()) / 86400000)
      : 0,
    lat: raw.lat ?? 0,
    lng: raw.lng ?? 0,
    listedAt: raw.listedAt ?? new Date().toISOString(),
    anomaly: null,
    anomalyDelta: 0,
  };
}

// Deduplicate listings across sources by (zone + area ± 2sqm + price ± 3%)
export function deduplicateListings(listings: PropertyListing[]): PropertyListing[] {
  const seen: PropertyListing[] = [];

  for (const listing of listings) {
    const isDuplicate = seen.some(s =>
      s.zone === listing.zone &&
      Math.abs(s.area - listing.area) <= 2 &&
      Math.abs(s.price - listing.price) / listing.price <= 0.03
    );
    if (!isDuplicate) seen.push(listing);
  }

  return seen;
}

// Tag anomalies after deduplication
export function tagAnomalies(listings: PropertyListing[]): PropertyListing[] {
  const zones = [...new Set(listings.map(l => l.zone))];

  zones.forEach(zone => {
    const zoneListings = listings.filter(l => l.zone === zone);
    const prices = zoneListings.map(l => l.pricePerSqm).sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)] ?? 0;

    zoneListings.forEach(l => {
      if (median === 0) return;
      const delta = ((l.pricePerSqm - median) / median) * 100;
      l.anomalyDelta = parseFloat(delta.toFixed(1));
      l.anomaly = delta <= -25 ? 'underpriced' : delta >= 25 ? 'overpriced' : null;
    });
  });

  return listings;
}
