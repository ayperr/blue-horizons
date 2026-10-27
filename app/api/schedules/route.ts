import { normalizeSchedules } from '@/lib/travel';
import { readTrip, reply, withinBudget } from '@/lib/provider-server';
export const runtime = 'nodejs';
const cache = new Map<string,{ at:number; body:object }>();
export async function POST(request: Request) {
  const trip = await readTrip(request);
  if (!trip) return reply({ status:'invalid', message:'Choose a departure, destination, 1–6 adults, and valid future dates. Trips can last up to 90 nights.' },400);
  const key = process.env.AVIATIONSTACK_API_KEY;
  if (!key || process.env.LIVE_SCHEDULES_ENABLED !== 'true') return reply({ status:'not_configured', message:'Live schedules are not connected yet. Check flight times and availability directly with JetBlue.' });
  const cacheKey = `${trip.origin}:${trip.checkin}`;
  // Cache airport board, so choosing another destination does not spend another request.
  const cached = cache.get(cacheKey);
  try {
    let body: unknown, checkedAt: string;
    if (cached && Date.now()-cached.at < 900000) { body=cached.body; checkedAt=new Date(cached.at).toISOString(); }
    else {
      if (!withinBudget('schedules')) return reply({ status:'limited', message:'The schedule request limit has been reached. Please check directly with JetBlue.' },429);
      const u = new URL('https://api.aviationstack.com/v1/flightsFuture');
      u.searchParams.set('access_key',key); u.searchParams.set('iataCode',trip.origin);
      u.searchParams.set('type','departure'); u.searchParams.set('date',trip.checkin);
      const res = await fetch(u, { cache:'no-store', signal:AbortSignal.timeout(12000) });
      if (!res.ok) throw new Error('Provider unavailable');
      body = await res.json();
      if (!body || typeof body !== 'object' || 'error' in body || !('data' in body) || !Array.isArray(body.data)) throw new Error('Provider unavailable');
      if (cache.size >= 80) cache.delete(cache.keys().next().value!);
      const at = Date.now(); cache.set(cacheKey,{ at, body }); checkedAt=new Date(at).toISOString();
    }
    const flights = normalizeSchedules(body,trip);
    return reply({ status:'live', source:'Aviationstack', checkedAt, flights, message: flights.length ? 'Airport-local scheduled times. Confirm with JetBlue before booking. Outbound flights only.' : 'No matching JetBlue flights were found in the returned airport board. This does not prove the route is unavailable; check JetBlue.', partial:true });
  } catch {
    return reply({ status:'unavailable', message:'The schedule provider could not return verified results. Check your provider plan and coverage, or continue directly to JetBlue.' },502);
  }
}
