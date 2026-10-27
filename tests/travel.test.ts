import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTrip, providerLinks, normalizeSchedules } from '../lib/travel';
import { destinations, airport } from '../lib/destinations';
import { routeInfo, routeMinutes, routes } from '../lib/routes';
import { safeBookingURL } from '../lib/provider-server';
const now=new Date('2026-10-27T12:00:00Z');
const trip={origin:'JFK',destination:'SJU',checkin:'2026-11-10',checkout:'2026-11-15',adults:2,country:'us'};
test('trip validation rejects impossible dates, equal airports and invalid adult counts',()=>{
  assert.ok(validateTrip(trip,now));
  for(const change of [{checkin:'2026-02-31'},{checkout:trip.checkin},{checkin:'2026-10-27'},{adults:0},{adults:2.5},{destination:'JFK'},{origin:'XXX'},{checkout:'2027-05-20'},{country:'xx'}])assert.equal(validateTrip({...trip,...change},now),null);
});
test('route map has only explicitly sourced connections',()=>{
  assert.equal(routeInfo('JFK','SJU')?.minutes,237);
  assert.equal(routeInfo('MCO','CDG'),undefined);
  assert.equal(routeMinutes('MCO','CDG'),Infinity);
  assert.equal(new Set(routes.map(r=>r.origin+r.destination)).size,routes.length);
  for(const r of routes){assert.ok(airport(r.origin));assert.ok(airport(r.destination));assert.ok(r.source.startsWith('https://'));assert.ok(r.effective);assert.ok(r.minutes>0);}
});
test('stay links preserve dates, destination and travelers without inventing offers',()=>{
  const links=providerLinks(destinations[0],trip),booking=new URL(links.booking),airbnb=new URL(links.airbnb);
  assert.equal(booking.hostname,'www.booking.com');assert.equal(booking.searchParams.get('checkin'),trip.checkin);assert.equal(booking.searchParams.get('group_adults'),'2');
  assert.equal(airbnb.searchParams.get('checkout'),trip.checkout);assert.equal(airbnb.searchParams.get('adults'),'2');
  assert.equal(new URL(links.uber).searchParams.get('pickup[latitude]'),String(airport('SJU').latitude));
  assert.equal(links.hertz,'https://www.hertz.com/');
});
test('schedule adapter rejects other airlines, dates and destinations and deduplicates',()=>{
  const row={airline:{iataCode:'B6'},departure:{iataCode:'JFK',scheduledTime:'2026-11-10 15:51:00'},arrival:{iataCode:'SJU',scheduledTime:'2026-11-10 20:48:00'},flight:{iataNumber:'B6803'}};
  const data=[row,row,{...row,airline:{iataCode:'DL'}},{...row,arrival:{iataCode:'LAX'}},{...row,departure:{iataCode:'JFK',scheduledTime:'2026-11-11 15:51:00'}}];
  assert.equal(normalizeSchedules({data},trip).length,1);
  assert.throws(()=>normalizeSchedules({error:'bad'},trip));
});
test('hotel redirect accepts HTTPS Booking.com URLs only',()=>{
  assert.ok(safeBookingURL('https://www.booking.com/hotel/example'));
  for(const u of ['javascript:alert(1)','https://booking.com.evil.test','http://booking.com/','https://evil.test/booking.com',null])assert.equal(safeBookingURL(u),null);
});
