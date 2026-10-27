import { airport, type Destination } from './destinations';
export type Trip = { origin: string; destination: string; checkin: string; checkout: string; adults: number; country: string };
export function validateTrip(raw: unknown, now = new Date()): Trip | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string,unknown>;
  if (typeof r.origin !== 'string' || typeof r.destination !== 'string' || typeof r.checkin !== 'string' || typeof r.checkout !== 'string') return null;
  if (!['JFK','BOS','FLL','MCO'].includes(r.origin) || !['SJU','NAS','CUN','AUA','SXM','BGI','LHR','CDG','JFK','BOS','LAX','SFO'].includes(r.destination) || r.origin === r.destination) return null;
  const validDay = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v;
  if (!validDay(r.checkin) || !validDay(r.checkout)) return null;
  const start = Date.parse(r.checkin), end = Date.parse(r.checkout), today = Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());
  if (start <= today || start > today + 365*86400000 || end <= start || end-start > 90*86400000 || end > today + 500*86400000) return null;
  if (!Number.isInteger(r.adults) || Number(r.adults)<1 || Number(r.adults)>6) return null;
  if (typeof r.country !== 'string' || !['us','gb','ca','fr','de','es','mx','au','nl','ie','br','in','jp'].includes(r.country)) return null;
  return { origin:r.origin, destination:r.destination, checkin:r.checkin, checkout:r.checkout, adults:Number(r.adults), country:r.country };
}
function url(base: string, params: Record<string,string>) { const u = new URL(base); for(const [k,v] of Object.entries(params)) u.searchParams.set(k,v); return u.toString(); }
export function providerLinks(d: Destination, t: Trip) {
  const a = airport(d.code);
  return {
    jetblue:'https://www.jetblue.com/',
    airbnb:url(`https://www.airbnb.com/s/${encodeURIComponent(d.city+', '+d.country)}/homes`,{ checkin:t.checkin, checkout:t.checkout, adults:String(t.adults) }),
    booking:url('https://www.booking.com/searchresults.html',{ ss:`${d.city}, ${d.country}`, checkin:t.checkin, checkout:t.checkout, group_adults:String(t.adults), no_rooms:'1', group_children:'0' }),
    hertz:'https://www.hertz.com/', enterprise:'https://www.enterprise.com/', sixt:'https://www.sixt.com/',
    uber:url('https://m.uber.com/ul/', { action:'setPickup', 'pickup[latitude]':String(a.latitude), 'pickup[longitude]':String(a.longitude), 'pickup[nickname]':`${d.code} airport`, 'dropoff[latitude]':String(d.center[0]), 'dropoff[longitude]':String(d.center[1]), 'dropoff[nickname]':`${d.city} city center` }),
    lyft:'https://www.lyft.com/rider'
  };
}
export type Schedule = { number: string; departure: string; arrival: string; destination: string; origin: string };
type Row = Record<string,unknown>;
function record(value: unknown): Row { return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {}; }
function field(obj: Row, key: string) { return typeof obj[key] === 'string' ? String(obj[key]) : ''; }
export function normalizeSchedules(payload: unknown, trip: Trip): Schedule[] {
  const root = record(payload);
  if (!Array.isArray(root.data)) throw new Error('Malformed schedule response');
  const seen = new Set<string>();
  return root.data.flatMap(value => {
    const row = record(value), airline = record(row.airline), dep = record(row.departure), arr = record(row.arrival), flight = record(row.flight);
    const carrier = (field(airline,'iataCode') || field(airline,'iata')).toUpperCase();
    const icao = (field(airline,'icaoCode') || field(airline,'icao')).toUpperCase();
    const from = (field(dep,'iataCode') || field(dep,'iata')).toUpperCase(), to = (field(arr,'iataCode') || field(arr,'iata')).toUpperCase();
    const departure = field(dep,'scheduledTime') || field(dep,'scheduled'), arrival = field(arr,'scheduledTime') || field(arr,'scheduled');
    const number = field(flight,'iataNumber') || field(flight,'iata') || field(flight,'number');
    if ((carrier !== 'B6' && icao !== 'JBU') || from !== trip.origin || to !== trip.destination || departure.slice(0,10)!==trip.checkin || !number || !arrival || !/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(departure) || !/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(arrival)) return [];
    const key = `${number}-${departure}`;
    if (seen.has(key)) return []; seen.add(key);
    return [{ number, departure, arrival, origin:from, destination:to }];
  }).sort((a,b) => a.departure.localeCompare(b.departure));
}
