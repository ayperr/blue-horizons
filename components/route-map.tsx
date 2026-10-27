'use client';
import { useMemo } from 'react';
import { geoMercator, geoPath, geoGraticule10 } from 'd3-geo';
import { feature } from 'topojson-client';
import world from 'world-atlas/countries-110m.json';
import { airport, type Destination } from '@/lib/destinations';
import { routeInfo } from '@/lib/routes';
type Props = { origin:string; destinations:Destination[]; active:string; onSelect:(code:string)=>void };
export default function RouteMap({origin,destinations,active,onSelect}:Props) {
  const projection = useMemo(()=>geoMercator().center([-43,31]).scale(285).translate([500,245]),[]);
  const path = useMemo(()=>geoPath(projection),[projection]);
  const land = useMemo(()=>feature(world as unknown as Parameters<typeof feature>[0],world.objects.countries as unknown as Parameters<typeof feature>[1]),[]);
  const project = (coordinates:[number,number]) => projection(coordinates)!.map(v=>Math.round(v*1000)/1000);
  const a = airport(origin), from = project([a.longitude,a.latitude]);
  return <svg className="route-map" viewBox="0 0 1000 470" aria-label={`Destination map. Lines show sourced example JetBlue routes from ${origin}. Select a destination to plan a trip.`}>
    <defs><radialGradient id="ocean"><stop stopColor="#1b5161"/><stop offset="1" stopColor="#102d41"/></radialGradient></defs>
    <rect width="1000" height="470" fill="url(#ocean)"/>
    <path d={path(geoGraticule10()) || ''} fill="none" stroke="#c8e9ec" strokeOpacity=".07" strokeWidth=".6"/>
    <path d={path(land) || ''} fill="#2b5260" stroke="#5a7c85" strokeWidth=".7"/>
    <text x="90" y="110" className="map-region">NORTH AMERICA</text><text x="748" y="65" className="map-region">EUROPE</text><text x="475" y="300" className="map-region ocean-label">THE ATLANTIC</text>
    {destinations.filter(d=>routeInfo(origin,d.code)).map(d=>{ const a=airport(d.code), to=project([a.longitude,a.latitude]); const selected=d.code===active;
      const midX=(from[0]+to[0])/2, midY=Math.min(from[1],to[1])-Math.abs(from[0]-to[0])*.22-35;
      return <path key={d.code} d={`M${from[0]},${from[1]} Q${midX},${midY} ${to[0]},${to[1]}`} fill="none" stroke={selected?'#f0b380':'#9cd9da'} strokeOpacity={selected?1:.28} strokeWidth={selected?2.5:1} strokeDasharray={selected?undefined:'3 5'}/>;
    })}
    {destinations.map(d=>{ const a=airport(d.code), p=project([a.longitude,a.latitude]), selected=d.code===active;
      return <g key={d.code} className="map-pin" role="button" tabIndex={0} aria-label={`Explore ${d.city}`} aria-pressed={selected} onClick={()=>onSelect(d.code)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){ e.preventDefault(); onSelect(d.code); }}}>
        <title>{`${d.city} · ${d.code}`}</title><circle cx={p[0]} cy={p[1]} r={selected?16:11} fill={selected?'#f0b380':'#b9e6e4'} opacity=".13"/>
        <circle cx={p[0]} cy={p[1]} r={selected?5:3.5} fill={selected?'#f0b380':'#c5eeeb'}/>
        {(selected||d.code==='LAX'||d.code==='CDG'||d.code==='CUN')&&<text x={p[0]+12} y={p[1]+4} className="map-city">{d.city}</text>}
      </g>;
    })}
    <circle cx={from[0]} cy={from[1]} r="6" fill="#fff"/><circle cx={from[0]} cy={from[1]} r="12" fill="none" stroke="#fff" strokeOpacity=".35"/>
    <text x={from[0]+15} y={from[1]-12} className="map-origin">{origin}</text>
  </svg>;
}
