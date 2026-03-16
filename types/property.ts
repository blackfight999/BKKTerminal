export type Source = 'DDProperty' | 'FazWaz' | 'Hipflat' | 'DotProperty';
export type PropertyType = 'Condo' | 'House' | 'Townhouse' | 'Land';
export type ListingType = 'Sale' | 'Rent';

export interface PropertyListing {
  id: string;
  source: Source;
  title: string;
  zone: string;
  subzone: string;
  type: PropertyType;
  listingType: ListingType;
  price: number; // THB
  area: number; // sqm
  pricePerSqm: number; // THB/sqm
  bedrooms: number;
  bathrooms: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  daysOnMarket: number;
  lat: number;
  lng: number;
  listedAt: string; // ISO date
  anomaly?: 'underpriced' | 'overpriced' | null;
  anomalyDelta?: number; // % deviation from district median
}

export interface ZoneSummary {
  zone: string;
  avgPricePerSqm: number;
  medianPricePerSqm: number;
  minPricePerSqm: number;
  maxPricePerSqm: number;
  listingCount: number;
  mom: number; // month-over-month % change
  yoy: number; // year-over-year % change
  anomalyCount: number; // listings flagged ±25% from median
  underpricedCount: number;
  overpricedCount: number;
}

export interface MarketTrend {
  month: string;
  avgPricePerSqm: number;
  listingCount: number;
  zone: string;
}

export interface SourceStats {
  source: Source;
  listingCount: number;
  avgPricePerSqm: number;
  lastUpdated: string;
}

export interface PriceAlert {
  id: string;
  zone: string;
  propertyType: PropertyType;
  thresholdPricePerSqm: number;
  direction: 'below' | 'above';
  email: string;
  active: boolean;
  createdAt: string;
}
