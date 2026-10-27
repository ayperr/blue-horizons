// Small, manually checked factual schedule snapshot. These are examples, not offers for selected dates.
export const routes = [
  { origin:'JFK', destination:'SJU', minutes:237, flight:'B6 803', effective:'November 1–18, 2026 (except Fridays)', source:'https://www.flight.info/B6803' },
  { origin:'JFK', destination:'NAS', minutes:195, flight:'B6 121', effective:'Published effective October 25, 2026', source:'https://info.flightmapper.net/route/JetBlue_B6_JFK_NAS' },
  { origin:'JFK', destination:'LAX', minutes:378, flight:'B6 123', effective:'Published effective October 26, 2026', source:'https://info.flightmapper.net/route/JetBlue_B6_JFK_LAX' },
  { origin:'JFK', destination:'CDG', minutes:453, flight:'B6 1407', effective:'Published effective October 25, 2026', source:'https://info.flightmapper.net/route/JetBlue_B6_JFK_CDG' },
  { origin:'BOS', destination:'SJU', minutes:242, flight:'B6 161', effective:'Published effective October 25, 2026', source:'https://info.flightmapper.net/route/JetBlue_B6_BOS_SJU' },
  { origin:'FLL', destination:'SJU', minutes:153, flight:'B6 253', effective:'Published effective October 25, 2026', source:'https://info.flightmapper.net/route/JetBlue_B6_FLL_SJU' },
  { origin:'MCO', destination:'SJU', minutes:173, flight:'B6 833', effective:'Published effective October 25, 2026', source:'https://info.flightmapper.net/route/JetBlue_B6_MCO_SJU' }
] as const;
export const routesChecked = 'October 27, 2026';
export function routeInfo(from:string,to:string) { return routes.find(r=>r.origin===from&&r.destination===to); }
export function routeMinutes(from:string,to:string) { return routeInfo(from,to)?.minutes ?? Number.POSITIVE_INFINITY; }
export function flightDuration(from:string,to:string) {
  const route=routeInfo(from,to);
  if(!route)return 'Check published schedules';
  return `${Math.floor(route.minutes/60)}h ${String(route.minutes%60).padStart(2,'0')}m published example`;
}
