import airportData from './airports.json';
import photos from './photos.json';
export { default as photos } from './photos.json';

export type Mood = 'All escapes' | 'Beach days' | 'City energy' | 'Food & culture' | 'Adventure';
export const moods: Mood[] = ['All escapes', 'Beach days', 'City energy', 'Food & culture', 'Adventure'];
export const origins = ['JFK', 'BOS', 'FLL', 'MCO'] as const;
export type Origin = typeof origins[number];
export type Destination = {
  code: string; city: string; country: string; region: string; mood: Mood[];
  image: string; kicker: string; description: string; stay: string; neighborhood: string;
  center: [number, number]; itinerary: [string, string, string];
};
const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=85`;
const guides: Destination[] = [
  { code:'SJU', city:'San Juan', country:'Puerto Rico', region:'Caribbean', mood:['Beach days','Food & culture'],
    image:photo('photo-1500375592092-40eb2168fd21'), kicker:'Salt air. Colorful streets. Your kind of reset.',
    description:'Trade your usual routine for ocean mornings, pastel streets, and a dinner that turns into a very long evening.',
    stay:'4–5 days', neighborhood:'Old San Juan or Condado', center:[18.4663,-66.1057],
    itinerary:['Wander the cobbled streets of Old San Juan.','Make room for a slow afternoon by the ocean.','Build an evening around Puerto Rican flavors.'] },
  { code:'NAS', city:'Nassau', country:'The Bahamas', region:'Caribbean', mood:['Beach days','Adventure'],
    image:photo('photo-1514282401047-d79a71a590e8'), kicker:'A different shade of blue around every corner.',
    description:'An island escape made for clear water, unhurried lunches, and leaving your shoes at the door.',
    stay:'3–4 days', neighborhood:'Cable Beach or downtown Nassau', center:[25.078,-77.338],
    itinerary:['Explore downtown and the waterfront.','Plan a beach day with nothing else on the calendar.','Find a local spot for a relaxed island dinner.'] },
  { code:'CUN', city:'Cancún', country:'Mexico', region:'Mexico', mood:['Beach days','Adventure'],
    image:photo('photo-1510414842594-a61c69b5ae57'), kicker:'Let the Caribbean set the pace.',
    description:'A generous dose of sunshine, long stretches of sand, and plenty of ways to get out on the water.',
    stay:'4–6 days', neighborhood:'Hotel Zone or downtown Cancún', center:[21.1619,-86.8515],
    itinerary:['Settle into the coast and take a long beach walk.','Choose a guided day trip that suits your pace.','Spend an evening exploring local food.'] },
  { code:'AUA', city:'Aruba', country:'Aruba', region:'Caribbean', mood:['Beach days','Adventure'],
    image:photo('photo-1473116763249-2faaef81ccda'), kicker:'Less scrolling. More shoreline.',
    description:'Wide-open horizons and a little room to breathe. Bring a good book and leave space for spontaneous detours.',
    stay:'5–6 days', neighborhood:'Palm Beach or Eagle Beach', center:[12.568,-70.044],
    itinerary:['Start with a slow morning on the sand.','Explore the island with a local guide.','Watch the light change over the water.'] },
  { code:'SXM', city:'St. Maarten', country:'Sint Maarten', region:'Caribbean', mood:['Beach days','Food & culture'],
    image:photo('photo-1507525428034-b723cf961d3e'), kicker:'One island, a world of possibilities.',
    description:'Beach time, lively waterfronts, and a food scene worth building a day around.',
    stay:'4–5 days', neighborhood:'Simpson Bay or Philipsburg', center:[18.026,-63.045],
    itinerary:['Find your favorite stretch of shoreline.','Explore Philipsburg at your own pace.','Leave an evening open for a memorable dinner.'] },
  { code:'BGI', city:'Bridgetown', country:'Barbados', region:'Caribbean', mood:['Beach days','Food & culture'],
    image:photo('photo-1464822759023-fed622ff2c3b'), kicker:'Island rhythm. A little adventure.',
    description:'From a waterfront wander to an afternoon by the sea, make this trip feel entirely your own.',
    stay:'5–6 days', neighborhood:'Carlisle Bay or the south coast', center:[13.0969,-59.6145],
    itinerary:['Take a walk through Bridgetown.','Spend an afternoon discovering the coast.','Try Bajan cooking at a local restaurant.'] },
  { code:'LHR', city:'London', country:'United Kingdom', region:'Europe', mood:['City energy','Food & culture'],
    image:photo('photo-1513635269975-59663e0ac1ad'), kicker:'New neighborhoods. Old favorites.',
    description:'An entire city of stories: riverside walks, museum afternoons, neighborhood pubs, and one more stop on the way home.',
    stay:'5–7 days', neighborhood:'South Bank or Bloomsbury', center:[51.5074,-0.1278],
    itinerary:['Follow the Thames through the heart of the city.','Pair a museum visit with a neighborhood walk.','Explore a food market and catch an evening show.'] },
  { code:'CDG', city:'Paris', country:'France', region:'Europe', mood:['City energy','Food & culture'],
    image:photo('photo-1502602898657-3e91760cbb34'), kicker:'Take the scenic route. Then take another.',
    description:'A café table in the sun, a favorite gallery, and a whole afternoon with no particular destination.',
    stay:'5–7 days', neighborhood:'Le Marais or Saint-Germain', center:[48.8566,2.3522],
    itinerary:['Start with a café and a long walk along the Seine.','Choose one museum and take your time.','Let a neighborhood bakery inspire your morning.'] },
  { code:'JFK', city:'New York', country:'United States', region:'North America', mood:['City energy','Food & culture'],
    image:photo('photo-1485871981521-5b1fd3805eee'), kicker:'Every block is a new beginning.',
    description:'Neighborhoods to get lost in, restaurants to come back for, and a skyline that never quite gets old.',
    stay:'4–6 days', neighborhood:'Lower Manhattan or Brooklyn', center:[40.7128,-74.006],
    itinerary:['Walk the waterfront and take in the skyline.','Explore a museum and the streets around it.','Build a night around dinner and a show.'] },
  { code:'BOS', city:'Boston', country:'United States', region:'North America', mood:['City energy','Food & culture'],
    image:photo('photo-1501979376754-2ff867a4f659'), kicker:'A small city with a lot of stories.',
    description:'Harbor walks, brick-lined streets, and neighborhood restaurants make a long weekend feel like a proper getaway.',
    stay:'3–4 days', neighborhood:'Back Bay or the North End', center:[42.3601,-71.0589],
    itinerary:['Follow the historic streets through downtown.','Spend a slow afternoon by the harbor.','Save an evening for the North End.'] },
  { code:'LAX', city:'Los Angeles', country:'United States', region:'North America', mood:['City energy','Adventure','Beach days'],
    image:photo('photo-1534190760961-74e8c1c5c3da'), kicker:'Chase the light all the way west.',
    description:'Coastal mornings, creative neighborhoods, and a sunset that makes you forget what time it is.',
    stay:'4–6 days', neighborhood:'Santa Monica or Silver Lake', center:[34.0522,-118.2437],
    itinerary:['Start on the coast with a long ocean walk.','Explore a neighborhood through its cafés and shops.','Find a viewpoint for the last light of the day.'] },
  { code:'SFO', city:'San Francisco', country:'United States', region:'North America', mood:['City energy','Adventure','Food & culture'],
    image:photo('photo-1501594907352-04cda38ebc29'), kicker:'Good food. Big hills. Bigger views.',
    description:'A city that rewards the curious, with waterfront paths, pocket neighborhoods, and an excellent next meal.',
    stay:'4–5 days', neighborhood:'Marina or Hayes Valley', center:[37.7749,-122.4194],
    itinerary:['Explore the waterfront on foot.','Spend an afternoon in a neighborhood you have never visited.','Make time for a bay view and a relaxed dinner.'] }
];
export const destinations: Destination[] = guides.map(d=>({...d,image:photos[d.code as keyof typeof photos].image}));
export function airport(code: string) {
  const item = airportData.airports.find(a => a.code === code);
  if (!item) throw new Error('Unknown airport');
  return item;
}
export function durationLabel(minutes: number) { return `${Math.floor(minutes/60)}h ${String(minutes%60).padStart(2,'0')}m`; }
export function isoDay(offset = 0) {
  const now = new Date(); now.setDate(now.getDate()+offset);
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
export const photoNote = 'Destination photographs are sourced from Wikimedia Commons via Wikipedia. Each Photo & license link opens its original file page with author, attribution, and reuse terms. The hero is editorial ocean imagery from Unsplash.';
