import { PropertyListing, ZoneSummary, SourceStats, Source } from '@/types/property';

export function getZoneSummariesFromListings(listings: PropertyListing[]): ZoneSummary[] {
  const saleListings = listings.filter(l => l.listingType === 'Sale');
  const zones = [...new Set(saleListings.map(l => l.zone))].filter(Boolean);

  return zones.map(zone => {
    const zoneListings = saleListings.filter(l => l.zone === zone);
    const prices = zoneListings.map(l => l.pricePerSqm).sort((a, b) => a - b);
    const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
    const median = prices[Math.floor(prices.length / 2)] ?? 0;

    // MoM/YoY computed from listedAt dates where available
    const now = Date.now();
    const oneMonth = 30 * 86400000;
    const threeMonths = 90 * 86400000;

    const recent = zoneListings.filter(l => now - new Date(l.listedAt).getTime() < oneMonth);
    const older = zoneListings.filter(l => {
      const age = now - new Date(l.listedAt).getTime();
      return age >= oneMonth && age < threeMonths;
    });

    let mom = 0;
    if (recent.length >= 3 && older.length >= 3) {
      const recentAvg = recent.reduce((s, l) => s + l.pricePerSqm, 0) / recent.length;
      const olderAvg = older.reduce((s, l) => s + l.pricePerSqm, 0) / older.length;
      mom = parseFloat(((recentAvg - olderAvg) / olderAvg * 100).toFixed(1));
    }

    const anomalies = zoneListings.filter(l => l.anomaly !== null);

    return {
      zone,
      avgPricePerSqm: Math.round(avg) || 0,
      medianPricePerSqm: Math.round(median) || 0,
      minPricePerSqm: prices[0] || 0,
      maxPricePerSqm: prices[prices.length - 1] || 0,
      listingCount: zoneListings.length,
      mom,
      yoy: 0, // needs historical data — not available from single scrape
      anomalyCount: anomalies.length,
      underpricedCount: zoneListings.filter(l => l.anomaly === 'underpriced').length,
      overpricedCount: zoneListings.filter(l => l.anomaly === 'overpriced').length,
    };
  }).sort((a, b) => b.avgPricePerSqm - a.avgPricePerSqm);
}

export function getSourceStatsFromListings(listings: PropertyListing[], scrapedAt: string): SourceStats[] {
  const sources: Source[] = ['DDProperty', 'FazWaz', 'Hipflat', 'DotProperty'];
  return sources.map(source => {
    const sl = listings.filter(l => l.source === source && l.listingType === 'Sale');
    const avg = sl.length > 0 ? sl.reduce((s, l) => s + l.pricePerSqm, 0) / sl.length : 0;
    return {
      source,
      listingCount: sl.length,
      avgPricePerSqm: Math.round(avg),
      lastUpdated: scrapedAt,
    };
  }).filter(s => s.listingCount > 0);
}

export function getAnomaliesFromListings(listings: PropertyListing[]): PropertyListing[] {
  return listings.filter(l => l.listingType === 'Sale' && l.anomaly !== null)
    .sort((a, b) => Math.abs(b.anomalyDelta ?? 0) - Math.abs(a.anomalyDelta ?? 0));
}

// For trend chart — group by zone and month using listedAt date
export function getMarketTrendsFromListings(listings: PropertyListing[], topZones: string[]): Array<{
  month: string; zone: string; avgPricePerSqm: number; listingCount: number;
}> {
  const saleListings = listings.filter(l => l.listingType === 'Sale' && topZones.includes(l.zone));
  const results: Array<{ month: string; zone: string; avgPricePerSqm: number; listingCount: number }> = [];

  topZones.forEach(zone => {
    const zl = saleListings.filter(l => l.zone === zone);
    const byMonth = new Map<string, number[]>();

    zl.forEach(l => {
      const d = new Date(l.listedAt);
      const key = `${d.toLocaleString('en-US', { month: 'short' })} ${d.getFullYear()}`;
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key)!.push(l.pricePerSqm);
    });

    byMonth.forEach((prices, month) => {
      const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
      results.push({ month, zone, avgPricePerSqm: Math.round(avg), listingCount: prices.length });
    });
  });

  return results;
}
