import { PropertyListing, ZoneSummary, MarketTrend, SourceStats, Source } from '@/types/property';

const zones = [
  { zone: 'Thonglor', subzones: ['Thonglor 5', 'Thonglor 10', 'Thonglor 13', 'Thonglor 17'], lat: 13.7290, lng: 100.5845 },
  { zone: 'Ekkamai', subzones: ['Ekkamai 2', 'Ekkamai 4', 'Ekkamai 6', 'Ekkamai 10'], lat: 13.7205, lng: 100.5862 },
  { zone: 'Asok', subzones: ['Sukhumvit 21', 'Sukhumvit 23', 'Sukhumvit 25'], lat: 13.7380, lng: 100.5600 },
  { zone: 'Phrom Phong', subzones: ['Sukhumvit 39', 'Sukhumvit 41', 'Sukhumvit 49'], lat: 13.7295, lng: 100.5697 },
  { zone: 'Silom', subzones: ['Silom Rd', 'Sathon', 'Bangrak'], lat: 13.7235, lng: 100.5276 },
  { zone: 'Ari', subzones: ['Ari 1', 'Ari 2', 'Phahon Yothin'], lat: 13.7757, lng: 100.5473 },
  { zone: 'Ratchada', subzones: ['Ratchadaphisek', 'Lat Phrao', 'Huai Khwang'], lat: 13.7750, lng: 100.5700 },
  { zone: 'On Nut', subzones: ['On Nut 1', 'On Nut 5', 'Sukhumvit 77'], lat: 13.7008, lng: 100.5982 },
  { zone: 'Phra Khanong', subzones: ['Phra Khanong 1', 'Phra Khanong 3'], lat: 13.7100, lng: 100.5891 },
  { zone: 'Lad Phrao', subzones: ['Lat Phrao 41', 'Lat Phrao 71', 'Lat Phrao 101'], lat: 13.8010, lng: 100.5776 },
];

const sources: Source[] = ['DDProperty', 'FazWaz', 'Hipflat', 'DotProperty'];

const zonePriceBase: Record<string, number> = {
  'Thonglor': 245000,
  'Ekkamai': 195000,
  'Asok': 230000,
  'Phrom Phong': 220000,
  'Silom': 210000,
  'Ari': 175000,
  'Ratchada': 145000,
  'On Nut': 125000,
  'Phra Khanong': 120000,
  'Lad Phrao': 105000,
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateListings(): PropertyListing[] {
  const listings: PropertyListing[] = [];
  let id = 1;

  zones.forEach((z, zIdx) => {
    const base = zonePriceBase[z.zone];
    const listingsPerZone = 40 + Math.floor(seededRandom(zIdx * 7) * 30);

    for (let i = 0; i < listingsPerZone; i++) {
      const seed = zIdx * 1000 + i;
      const r = (n: number) => seededRandom(seed + n);

      const source = sources[Math.floor(r(1) * sources.length)];
      const subzone = z.subzones[Math.floor(r(2) * z.subzones.length)];
      const area = 28 + Math.floor(r(3) * 150);
      const variance = 0.75 + r(4) * 0.5;
      const pricePerSqm = Math.round(base * variance / 1000) * 1000;
      const price = area * pricePerSqm;
      const bedrooms = area < 45 ? 1 : area < 75 ? (r(5) > 0.5 ? 1 : 2) : area < 120 ? 2 : 3;
      const daysOnMarket = Math.floor(r(6) * 180);
      const monthsAgo = Math.floor(r(7) * 6);
      const date = new Date(2026, 2 - monthsAgo, 1 + Math.floor(r(8) * 28));

      listings.push({
        id: `L${String(id++).padStart(4, '0')}`,
        source,
        title: `${bedrooms}BR Condo ${subzone}`,
        zone: z.zone,
        subzone,
        type: 'Condo',
        listingType: r(9) > 0.15 ? 'Sale' : 'Rent',
        price,
        area,
        pricePerSqm,
        bedrooms,
        bathrooms: bedrooms,
        floor: 5 + Math.floor(r(10) * 35),
        totalFloors: 30 + Math.floor(r(11) * 30),
        yearBuilt: 2010 + Math.floor(r(12) * 16),
        daysOnMarket,
        lat: z.lat + (r(13) - 0.5) * 0.02,
        lng: z.lng + (r(14) - 0.5) * 0.02,
        listedAt: date.toISOString(),
        anomaly: null,
        anomalyDelta: 0,
      });
    }
  });

  // Tag anomalies: ±25% from zone median
  const zoneNames = [...new Set(listings.map(l => l.zone))];
  zoneNames.forEach(zone => {
    const zoneListings = listings.filter(l => l.zone === zone && l.listingType === 'Sale');
    const prices = zoneListings.map(l => l.pricePerSqm).sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];
    zoneListings.forEach(l => {
      const delta = ((l.pricePerSqm - median) / median) * 100;
      l.anomalyDelta = parseFloat(delta.toFixed(1));
      if (delta <= -25) l.anomaly = 'underpriced';
      else if (delta >= 25) l.anomaly = 'overpriced';
      else l.anomaly = null;
    });
  });

  return listings;
}

export const listings: PropertyListing[] = generateListings();

export function getZoneSummaries(): ZoneSummary[] {
  return zones.map((z, zIdx) => {
    const zoneListings = listings.filter(l => l.zone === z.zone && l.listingType === 'Sale');
    const prices = zoneListings.map(l => l.pricePerSqm).sort((a, b) => a - b);
    const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
    const median = prices[Math.floor(prices.length / 2)];
    const r = (n: number) => seededRandom(zIdx * 100 + n);
    const anomalies = zoneListings.filter(l => l.anomaly !== null);

    return {
      zone: z.zone,
      avgPricePerSqm: Math.round(avg),
      medianPricePerSqm: Math.round(median),
      minPricePerSqm: prices[0],
      maxPricePerSqm: prices[prices.length - 1],
      listingCount: zoneListings.length,
      mom: parseFloat(((r(1) - 0.4) * 6).toFixed(1)),
      yoy: parseFloat(((r(2) - 0.3) * 15).toFixed(1)),
      anomalyCount: anomalies.length,
      underpricedCount: zoneListings.filter(l => l.anomaly === 'underpriced').length,
      overpricedCount: zoneListings.filter(l => l.anomaly === 'overpriced').length,
    };
  });
}

export function getMarketTrends(zone?: string): MarketTrend[] {
  const trends: MarketTrend[] = [];
  const months = ['Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026'];
  const targetZones = zone ? zones.filter(z => z.zone === zone) : zones.slice(0, 5);

  targetZones.forEach((z, zIdx) => {
    const base = zonePriceBase[z.zone];
    months.forEach((month, mIdx) => {
      const r = seededRandom(zIdx * 100 + mIdx * 7);
      const trend = 1 + (mIdx * 0.008) + (r - 0.5) * 0.04;
      trends.push({
        month,
        zone: z.zone,
        avgPricePerSqm: Math.round(base * trend / 1000) * 1000,
        listingCount: 30 + Math.floor(r * 40),
      });
    });
  });

  return trends;
}

export function getSourceStats(): SourceStats[] {
  return sources.map(source => {
    const sourceListings = listings.filter(l => l.source === source && l.listingType === 'Sale');
    const avg = sourceListings.reduce((s, l) => s + l.pricePerSqm, 0) / sourceListings.length;
    return {
      source,
      listingCount: sourceListings.length,
      avgPricePerSqm: Math.round(avg),
      lastUpdated: new Date(2026, 2, 16, 2, 0).toISOString(),
    };
  });
}

export function getAnomalies(zone?: string): PropertyListing[] {
  return listings.filter(l =>
    l.listingType === 'Sale' &&
    l.anomaly !== null &&
    (!zone || l.zone === zone)
  ).sort((a, b) => Math.abs(b.anomalyDelta ?? 0) - Math.abs(a.anomalyDelta ?? 0));
}
