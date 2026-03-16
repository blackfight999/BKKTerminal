export interface Station {
  id: string;
  name: string;
  line: 'BTS Sukhumvit' | 'BTS Silom' | 'MRT Blue' | 'MRT Purple' | 'ARL';
  lat: number;
  lng: number;
}

export const stations: Station[] = [
  // BTS Sukhumvit Line
  { id: 'BTS-N8', name: 'Mo Chit', line: 'BTS Sukhumvit', lat: 13.8025, lng: 100.5530 },
  { id: 'BTS-N7', name: 'Saphan Khwai', line: 'BTS Sukhumvit', lat: 13.7939, lng: 100.5519 },
  { id: 'BTS-N6', name: 'Ari', line: 'BTS Sukhumvit', lat: 13.7757, lng: 100.5473 },
  { id: 'BTS-N5', name: 'Sanam Pao', line: 'BTS Sukhumvit', lat: 13.7631, lng: 100.5461 },
  { id: 'BTS-N4', name: 'Victory Monument', line: 'BTS Sukhumvit', lat: 13.7645, lng: 100.5377 },
  { id: 'BTS-N3', name: 'Phaya Thai', line: 'BTS Sukhumvit', lat: 13.7561, lng: 100.5337 },
  { id: 'BTS-N2', name: 'Ratchathewi', line: 'BTS Sukhumvit', lat: 13.7477, lng: 100.5337 },
  { id: 'BTS-CEN', name: 'Siam', line: 'BTS Sukhumvit', lat: 13.7456, lng: 100.5347 },
  { id: 'BTS-E1', name: 'Chit Lom', line: 'BTS Sukhumvit', lat: 13.7461, lng: 100.5404 },
  { id: 'BTS-E2', name: 'Phloen Chit', line: 'BTS Sukhumvit', lat: 13.7430, lng: 100.5466 },
  { id: 'BTS-E3', name: 'Nana', line: 'BTS Sukhumvit', lat: 13.7402, lng: 100.5534 },
  { id: 'BTS-E4', name: 'Asok', line: 'BTS Sukhumvit', lat: 13.7380, lng: 100.5600 },
  { id: 'BTS-E5', name: 'Phrom Phong', line: 'BTS Sukhumvit', lat: 13.7295, lng: 100.5697 },
  { id: 'BTS-E6', name: 'Thong Lo', line: 'BTS Sukhumvit', lat: 13.7266, lng: 100.5802 },
  { id: 'BTS-E7', name: 'Ekkamai', line: 'BTS Sukhumvit', lat: 13.7205, lng: 100.5862 },
  { id: 'BTS-E8', name: 'Phra Khanong', line: 'BTS Sukhumvit', lat: 13.7138, lng: 100.5957 },
  { id: 'BTS-E9', name: 'On Nut', line: 'BTS Sukhumvit', lat: 13.7008, lng: 100.5982 },
  // BTS Silom Line
  { id: 'BTS-W1', name: 'National Stadium', line: 'BTS Silom', lat: 13.7458, lng: 100.5291 },
  { id: 'BTS-S1', name: 'Ratchadamri', line: 'BTS Silom', lat: 13.7400, lng: 100.5391 },
  { id: 'BTS-S2', name: 'Sala Daeng', line: 'BTS Silom', lat: 13.7280, lng: 100.5292 },
  { id: 'BTS-S3', name: 'Chong Nonsi', line: 'BTS Silom', lat: 13.7220, lng: 100.5279 },
  { id: 'BTS-S4', name: 'Saint Louis', line: 'BTS Silom', lat: 13.7173, lng: 100.5271 },
  { id: 'BTS-S5', name: 'Surasak', line: 'BTS Silom', lat: 13.7165, lng: 100.5208 },
  { id: 'BTS-S6', name: 'Saphan Taksin', line: 'BTS Silom', lat: 13.7192, lng: 100.5139 },
  // MRT Blue Line
  { id: 'MRT-BL01', name: 'Hua Lamphong', line: 'MRT Blue', lat: 13.7384, lng: 100.5169 },
  { id: 'MRT-BL09', name: 'Silom', line: 'MRT Blue', lat: 13.7235, lng: 100.5276 },
  { id: 'MRT-BL10', name: 'Lumphini', line: 'MRT Blue', lat: 13.7245, lng: 100.5407 },
  { id: 'MRT-BL11', name: 'Khlong Toei', line: 'MRT Blue', lat: 13.7206, lng: 100.5557 },
  { id: 'MRT-BL12', name: 'Queen Sirikit', line: 'MRT Blue', lat: 13.7222, lng: 100.5594 },
  { id: 'MRT-BL13', name: 'Asok/Sukhumvit', line: 'MRT Blue', lat: 13.7378, lng: 100.5603 },
  { id: 'MRT-BL16', name: 'Ratchadaphisek', line: 'MRT Blue', lat: 13.7593, lng: 100.5698 },
  { id: 'MRT-BL17', name: 'Lat Phrao', line: 'MRT Blue', lat: 13.7737, lng: 100.5689 },
  { id: 'MRT-BL18', name: 'Chatuchak Park', line: 'MRT Blue', lat: 13.8011, lng: 100.5534 },
  // Airport Rail Link
  { id: 'ARL-PA', name: 'Phaya Thai', line: 'ARL', lat: 13.7561, lng: 100.5337 },
  { id: 'ARL-RP', name: 'Ratchaprarop', line: 'ARL', lat: 13.7558, lng: 100.5428 },
  { id: 'ARL-MK', name: 'Makkasan', line: 'ARL', lat: 13.7529, lng: 100.5622 },
  { id: 'ARL-RK', name: 'Ramkhamhaeng', line: 'ARL', lat: 13.7532, lng: 100.5857 },
];

export function getZonesNearStation(stationId: string, radiusKm: number): string[] {
  const station = stations.find(s => s.id === stationId);
  if (!station) return [];

  const zoneCoords: Record<string, { lat: number; lng: number }> = {
    'Thonglor': { lat: 13.7290, lng: 100.5845 },
    'Ekkamai': { lat: 13.7205, lng: 100.5862 },
    'Asok': { lat: 13.7380, lng: 100.5600 },
    'Phrom Phong': { lat: 13.7295, lng: 100.5697 },
    'Silom': { lat: 13.7235, lng: 100.5276 },
    'Ari': { lat: 13.7757, lng: 100.5473 },
    'Ratchada': { lat: 13.7750, lng: 100.5700 },
    'On Nut': { lat: 13.7008, lng: 100.5982 },
    'Phra Khanong': { lat: 13.7100, lng: 100.5891 },
    'Lad Phrao': { lat: 13.8010, lng: 100.5776 },
  };

  function distKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  return Object.entries(zoneCoords)
    .filter(([, coord]) => distKm(station.lat, station.lng, coord.lat, coord.lng) <= radiusKm)
    .map(([zone]) => zone);
}
