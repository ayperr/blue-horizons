import { destinations } from '@/lib/destinations';
import { readTrip, reply, safeBookingURL, withinBudget } from '@/lib/provider-server';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  const trip = await readTrip(request);
  if (!trip) return reply({ status:'invalid', message:'Choose valid trip dates, a destination, your country of residence, and 1–6 adults.' },400);
  const key = process.env.BOOKING_API_KEY, affiliate = process.env.BOOKING_AFFILIATE_ID;
  if (!key || !affiliate || process.env.LIVE_STAYS_ENABLED !== 'true') return reply({ status:'not_configured', message:'Hotel inventory is not connected yet. Search Booking.com or Airbnb using your trip details.' });
  if (!withinBudget('stays',2)) return reply({ status:'limited', message:'The hotel request limit has been reached. Continue to Booking.com to search.' },429);
  const sandbox = process.env.BOOKING_ENVIRONMENT !== 'production';
  const host = sandbox ? 'https://demandapi-sandbox.booking.com/3.3' : 'https://demandapi.booking.com/3.3';
  const d = destinations.find(d=>d.code===trip.destination)!;
  const post = async(path:string,body:object) => {
    const res = await fetch(host+path, { method:'POST', headers:{ Authorization:`Bearer ${key}`, 'X-Affiliate-Id':affiliate, 'Content-Type':'application/json' }, body:JSON.stringify(body), cache:'no-store', signal:AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error('Provider unavailable');
    const result = await res.json();
    if (!Array.isArray(result.data) || result.errors) throw new Error('Malformed response');
    return result;
  };
  try {
    const result = await post('/accommodations/search', {
      booker:{ country:trip.country, platform:'desktop' }, checkin:trip.checkin, checkout:trip.checkout,
      guests:{ number_of_adults:trip.adults, number_of_rooms:1 },
      coordinates:{ latitude:d.center[0], longitude:d.center[1], radius:15 }, rows:10
    });
    const ids = result.data.map((r:{id:unknown})=>r.id).filter((id:unknown)=>typeof id === 'number' && Number.isInteger(id)).slice(0,10);
    if (!ids.length) return reply({ status:sandbox?'sandbox':'live', stays:[], message:'No matching properties were returned. You can continue your search on Booking.com.' });
    const details = await post('/accommodations/details',{ accommodations:ids, languages:['en-gb'] });
    const stays = details.data.flatMap((r:{id:unknown;name?:Record<string,string>;url?:unknown})=>{
      const url = safeBookingURL(r.url), name = r.name?.['en-gb'];
      return typeof name === 'string' && url && ids.includes(r.id) ? [{ id:r.id, name, url }] : [];
    });
    return reply({ status:sandbox?'sandbox':'live', source:'Booking.com', checkedAt:new Date().toISOString(), stays, message:sandbox?'Test inventory from the Booking.com sandbox. These are not bookable offers.':'Availability from Booking.com. Review final prices, fees, and terms on the provider site.' });
  } catch { return reply({ status:'unavailable', message:'Hotel inventory is temporarily unavailable. Continue your search directly with Booking.com or Airbnb.' },502); }
}
