'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, ArrowLeft, Plane, Waves, Compass, Heart, Search, MapPin, X, BedDouble, CarFront, Navigation, CalendarDays, Check, Plus, SlidersHorizontal, Globe2, Sparkles, Coffee, Mountain, Share2, LoaderCircle, Info, CheckCircle2, Download } from 'lucide-react';
import { airport, destinations, isoDay, moods, origins, photoNote, photos, type Destination, type Mood, type Origin } from '@/lib/destinations';
import { providerLinks, validateTrip, type Schedule, type Trip } from '@/lib/travel';
import RouteMap from './route-map';
import { flightDuration, routeInfo, routeMinutes, routes, routesChecked } from '@/lib/routes';

type ProviderResult = { status:string; message:string; checkedAt?:string; flights?:Schedule[]; stays?:{id:number;name:string;url:string}[]; partial?:boolean };
type Modal = 'trip'|'saved'|'compare'|'data'|null;
const countryNames: Record<string,string> = { us:'United States',gb:'United Kingdom',ca:'Canada',fr:'France',de:'Germany',es:'Spain',mx:'Mexico',au:'Australia',nl:'Netherlands',ie:'Ireland',br:'Brazil',in:'India',jp:'Japan' };
const photoHero='https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=90';
const moodIcons = [Compass,Waves,Globe2,Coffee,Mountain];

export default function Explorer() {
  const [origin,setOrigin]=useState<Origin>('JFK'), [mood,setMood]=useState<Mood>('All escapes');
  const [query,setQuery]=useState(''), [shortOnly,setShortOnly]=useState(false), [sort,setSort]=useState('curated');
  const [active,setActive]=useState('SJU'), [saved,setSaved]=useState<string[]>([]), [ready,setReady]=useState(false);
  const [modal,setModal]=useState<Modal>(null), [toast,setToast]=useState('');
  const [checkin,setCheckin]=useState(''), [checkout,setCheckout]=useState(''), [adults,setAdults]=useState(2), [country,setCountry]=useState('us');
  const [schedules,setSchedules]=useState<ProviderResult|null>(null), [stays,setStays]=useState<ProviderResult|null>(null);
  const [busySchedule,setBusySchedule]=useState(false), [busyStays,setBusyStays]=useState(false), [shareURL,setShareURL]=useState('');
  const dialog=useRef<HTMLDialogElement>(null), scheduleRequest=useRef<AbortController|null>(null), stayRequest=useRef<AbortController|null>(null);
  const current=destinations.find(d=>d.code===active)!;
  const trip:Trip={origin,destination:active,checkin,checkout,adults,country};
  const validTrip=Boolean(validateTrip(trip));
  const signature=JSON.stringify(trip);
  const links=providerLinks(current,trip);

  useEffect(()=>{
    let draft:Partial<Trip>={};
    try {
      const stored=JSON.parse(localStorage.getItem('blue-horizons-saved')||'[]');
      if(Array.isArray(stored)) setSaved([...new Set(stored.filter((x:unknown)=>typeof x==='string'&&destinations.some(d=>d.code===x)))].slice(0,3));
      const parsed=JSON.parse(localStorage.getItem('blue-horizons-trip')||'null');
      if(validateTrip(parsed)) draft=parsed;
    } catch { /* A blocked storage setting should not stop trip planning. */ }
    const p=new URLSearchParams(window.location.search);
    const shared={ origin:p.get('from'), destination:p.get('to'), checkin:p.get('in'), checkout:p.get('out'), adults:Number(p.get('adults')), country:p.get('country')||'us' };
    if(validateTrip(shared)) draft=shared as Trip;
    if(draft.origin) setOrigin(draft.origin as Origin);
    if(draft.destination) setActive(draft.destination);
    setCheckin(draft.checkin||isoDay(14)); setCheckout(draft.checkout||isoDay(19));
    setAdults(draft.adults||2); setCountry(draft.country||'us'); setReady(true);
  },[]);
  useEffect(()=>{ if(ready) try {localStorage.setItem('blue-horizons-saved',JSON.stringify(saved));} catch {} },[saved,ready]);
  useEffect(()=>{ if(!toast)return; const t=setTimeout(()=>setToast(''),4000); return ()=>clearTimeout(t); },[toast]);
  useEffect(()=>{
    scheduleRequest.current?.abort(); stayRequest.current?.abort(); setSchedules(null); setStays(null); setBusySchedule(false); setBusyStays(false); setShareURL('');
  },[signature]);
  const filtered=useMemo(()=>{
    let list=destinations.filter(d=>d.code!==origin && (mood==='All escapes'||d.mood.includes(mood)) && (!shortOnly||routeMinutes(origin,d.code)<=240) && `${d.city} ${d.country} ${d.code}`.toLowerCase().includes(query.toLowerCase().trim()));
    if(sort==='duration')list=list.toSorted((a,b)=>routeMinutes(origin,a.code)-routeMinutes(origin,b.code));
    if(sort==='az')list=list.toSorted((a,b)=>a.city.localeCompare(b.city));
    return list;
  },[origin,mood,shortOnly,query,sort]);
  const mapCurrent=filtered.find(d=>d.code===active)||filtered[0];

  function show(kind:Modal) { setModal(kind); if(!dialog.current?.open)dialog.current?.showModal(); }
  function close() {dialog.current?.close();setModal(null);}
  function plan(d:Destination) { setActive(d.code);show('trip'); }
  function changeOrigin(value:Origin) { setOrigin(value); if(value===active)setActive(value==='JFK'?'SJU':'JFK'); }
  function toggleSave(code:string) {
    if(saved.includes(code)) {setSaved(saved.filter(x=>x!==code));return;}
    if(saved.length===3) {setToast('Your shortlist holds 3 escapes. Remove one to make room.');return;}
    setSaved([...saved,code]);setToast('Added to your shortlist.');
  }
  async function lookup(service:'schedules'|'stays') {
    if(!validTrip)return;
    const ref=service==='schedules'?scheduleRequest:stayRequest;
    ref.current?.abort(); const controller=new AbortController();ref.current=controller;
    const setBusy=service==='schedules'?setBusySchedule:setBusyStays;
    const setResult=service==='schedules'?setSchedules:setStays;
    setBusy(true);
    try {
      const r=await fetch(`/api/${service}`,{method:'POST',headers:{'Content-Type':'application/json'},body:signature,signal:controller.signal});
      const body=await r.json(); if(!controller.signal.aborted)setResult(body);
    } catch {if(!controller.signal.aborted)setResult({status:'unavailable',message:'We could not complete the search. Please try again or continue to the provider.'});}
    finally {if(ref.current===controller)setBusy(false);}
  }
  function saveTrip() {
    if(!validTrip)return;
    try {localStorage.setItem('blue-horizons-trip',signature);setToast('Trip saved on this device.');} catch {setToast('Device storage is unavailable. Use Share trip to keep a link.');}
  }
  async function share() {
    if(!validTrip)return;
    const u=new URL(window.location.origin+window.location.pathname);
    for(const [k,v] of Object.entries({from:origin,to:active,in:checkin,out:checkout,adults:String(adults),country}))u.searchParams.set(k,v);
    setShareURL(u.toString());
    try {await navigator.clipboard.writeText(u.toString());setToast('Trip link copied.');} catch {setToast('Your trip link is ready below.');}
  }
  function exportTrip() {
    if(!validTrip)return;
    const text=`BLUE HORIZONS\n${current.city}, ${current.country}\n${origin} → ${active}\n${checkin} to ${checkout} · ${adults} adult(s)\n\nYOUR IDEAS\n${current.itinerary.map((x,i)=>`${i+1}. ${x}`).join('\n')}\n\nFLIGHTS\nCheck schedules and book: ${links.jetblue}\n\nSTAYS\nBooking.com: ${links.booking}\nAirbnb: ${links.airbnb}\n\nCARS\nEnter ${active} airport and your trip dates on the provider website.\nHertz: ${links.hertz}\nEnterprise: ${links.enterprise}\nSixt: ${links.sixt}\n\nAIRPORT RIDES\nUber (airport to city center; edit destination): ${links.uber}\nLyft (set pickup and destination in the app): ${links.lyft}\n\nIndependent concept, not affiliated with JetBlue or other providers. Nothing has been booked. Routes and durations are published schedule examples checked October 27, 2026, not live availability for selected dates. Confirm all routes, prices, coverage and availability with each provider.\n`;
    const u=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download=`blue-horizons-${active.toLowerCase()}-trip.txt`;a.click();URL.revokeObjectURL(u);
  }
  function ProviderLink({href,name,detail,brand}:{href:string;name:string;detail:string;brand?:string}) {
    return <a className="provider-link" href={href} target="_blank" rel="noopener noreferrer"><span className={`provider-brand ${brand||''}`}>{name}</span><span>{detail}</span><ArrowUpRight size={18}/></a>;
  }
  function Result({result}:{result:ProviderResult|null}) {
    if(!result)return null;
    return <div className={`provider-result ${result.status==='live'?'verified':''}`} role="status"><p><Info size={15}/>{result.message}</p>
      {result.checkedAt&&<small>Checked {new Date(result.checkedAt).toLocaleString()} · {result.status==='sandbox'?'Sandbox data':'Provider response'}</small>}
      {result.flights?.map(f=><div className="flight-row" key={f.number+f.departure}><b>{f.number}</b><span>{f.departure.slice(11,16)} {f.origin} <ArrowRight size={12}/> {f.arrival.slice(11,16)} {f.destination}<small>Arrival {f.arrival.slice(0,10)}</small></span></div>)}
      {result.partial&&<small>Results may be incomplete; this search reads one airport-board response.</small>}
      {result.stays?.map(s=><a className="stay-result" key={s.id} href={s.url} target="_blank" rel="noopener noreferrer">{s.name}<ArrowUpRight size={16}/></a>)}
    </div>;
  }

  return <>
    <a className="skip-link" href="#explore">Skip to destinations</a>
    <header className="header"><a href="#" className="wordmark" aria-label="Blue Horizons home"><span className="brand-icon"><Waves size={23}/></span>blue horizons<span className="brand-dot">.</span></a>
      <nav aria-label="Main navigation"><a href="#explore" className="nav-active">Explore destinations</a><a href="#how">The whole trip</a><button onClick={()=>show('data')}>Our sources</button></nav>
      <button className="shortlist-button" onClick={()=>show('saved')}><Heart size={17}/> My shortlist <span>{saved.length}</span></button>
    </header>
    <main>
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><span/> A JETBLUE-INSPIRED TRAVEL EXPERIENCE</div>
          <h1>A little further.<br/>A little <em>bluer.</em></h1>
          <p>Find a place that feels like a deep breath.<br className="desktop-break"/> We’ll help you put the whole trip together.</p>
          <a href="#explore" className="primary-button">Find my next escape <ArrowUpRight size={20}/></a>
          <div className="hero-footnote"><span className="tiny-plane"><Plane size={18}/></span><span>From the first flight to the last mile.<br/><strong>Your next chapter starts here.</strong></span></div>
        </div>
        <div className="hero-visual" style={{backgroundImage:`url("${photoHero}")`}} role="img" aria-label="Sunlit ocean waves rolling toward shore">
          <span className="image-coordinate">18° N &nbsp; 66° W &nbsp; / &nbsp; A CARIBBEAN STATE OF MIND</span>
          <div className="hero-photo-label"><span>LESS ROUTINE, MORE</span><strong>somewhere new.</strong></div>
          <div className="floating-ticket"><span className="ticket-icon"><Plane size={22}/></span><div><span>ONE TRIP. ALL THE POSSIBILITIES.</span><b>Where will blue take you?</b></div><ArrowUpRight size={20}/></div>
          <span className="editorial-credit">Editorial travel imagery · Unsplash</span>
        </div>
        <div className="hero-index"><span>01 / THE ART OF GETTING AWAY</span><span>SCROLL TO EXPLORE <ArrowRight size={13}/></span></div>
      </section>
      <section className="trip-strip" id="how"><span className="strip-intro">A great escape is<br/><b>more than a flight.</b></span>
        {[{Icon:Plane,title:'Find your flight',text:'JetBlue, here we come.'},{Icon:BedDouble,title:'Stay somewhere good',text:'Airbnb & Booking.com'},{Icon:CarFront,title:'Take the scenic route',text:'Hertz, Enterprise & more'},{Icon:Navigation,title:'Make the last mile easy',text:'Uber & Lyft'}].map(({Icon,title,text},i)=><div className="strip-step" key={title}><span className="step-number">0{i+1}</span><Icon size={23} strokeWidth={1.4}/><div><b>{title}</b><span>{text}</span></div></div>)}
      </section>
      <section className="explore-section" id="explore">
        <div className="section-title"><div><div className="eyebrow">FOLLOW YOUR CURIOSITY</div><h2>Where do you want to <em>feel?</em></h2></div><p>A sun-soaked shore or a city that never slows.<br/>There’s a little blue for every kind of you.</p></div>
        <div className="search-bar"><label className="origin-field"><Plane size={20}/><span><small>TAKING OFF FROM</small><select aria-label="Departure airport" value={origin} onChange={e=>changeOrigin(e.target.value as Origin)}>{origins.map(code=><option key={code} value={code}>{airport(code).city} ({code})</option>)}</select></span></label>
          <label className="destination-search"><Search size={19}/><input placeholder="A city, an island, a possibility…" aria-label="Search destinations" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button onClick={()=>setQuery('')} aria-label="Clear destination search"><X size={16}/></button>}</label>
          <button className={`short-toggle ${shortOnly?'enabled':''}`} aria-pressed={shortOnly} onClick={()=>setShortOnly(!shortOnly)}><SlidersHorizontal size={16}/> Under 4 hours <span className="toggle-track"><i/></span></button>
        </div>
        <div className="mood-row"><div className="moods" aria-label="Filter by travel mood">{moods.map((m,i)=>{const Icon=moodIcons[i];return <button className={mood===m?'selected':''} key={m} onClick={()=>setMood(m)} aria-pressed={mood===m}><Icon size={16}/>{m}</button>;})}</div><span className="results-count" aria-live="polite">{filtered.length} places to get lost in</span></div>
        <div className="map-panel"><div className="map-story"><span className="map-kicker">A WORLD OF BLUE</span><h3>Your next story<br/>starts with a <em>dot.</em></h3><p>Follow a connection. Find your place.<br/>Leave the everyday a little behind.</p>
          {mapCurrent?<button className="map-destination" onClick={()=>plan(mapCurrent)}><span className="destination-thumb" style={{backgroundImage:`url("${mapCurrent.image}")`}}/><span><small>ON YOUR HORIZON</small><b>{mapCurrent.city}</b><span>{flightDuration(origin,mapCurrent.code)}</span></span><ArrowUpRight size={21}/></button>:<p className="map-empty">Try another mood or clear your filters.</p>}
          <span className="map-disclaimer">Lines: sourced route examples · checked Oct 27, 2026</span>
        </div><div className="map-canvas"><RouteMap origin={origin} destinations={filtered} active={mapCurrent?.code||''} onSelect={setActive}/><div className="map-legend"><span><i/> Departing from {origin}</span><span><i/> Somewhere new</span></div></div></div>
        <div className="grid-heading"><h3>A few places to fall for<span>.</span></h3><label>Sort by <select value={sort} onChange={e=>setSort(e.target.value)} aria-label="Sort destinations"><option value="curated">Our favorites</option><option value="duration">Published flight time</option><option value="az">A to Z</option></select></label></div>
        <div className="destination-grid">{filtered.map((d,i)=><article className="destination-card" key={d.code}>
          <div className="card-image" style={{backgroundImage:`url("${d.image}")`}}><button className="image-hit" onClick={()=>plan(d)} aria-label={`Plan a trip to ${d.city}`}/><span className="card-region">{d.region}</span><button className={`save-button ${saved.includes(d.code)?'is-saved':''}`} aria-label={`${saved.includes(d.code)?'Remove':'Save'} ${d.city}`} aria-pressed={saved.includes(d.code)} onClick={()=>toggleSave(d.code)}><Heart size={19} fill={saved.includes(d.code)?'currentColor':'none'}/></button><span className="card-number">{String(i+1).padStart(2,'0')} / {d.code}</span><a className="photo-credit" href={photos[d.code as keyof typeof photos].credit} target="_blank" rel="noopener noreferrer">Photo & license</a></div>
          <div className="card-content"><div className="card-location"><div><small>{d.country}</small><h3><button onClick={()=>plan(d)}>{d.city}</button></h3></div><button className="circle-arrow" aria-label={`Explore ${d.city}`} onClick={()=>plan(d)}><ArrowUpRight size={23}/></button></div><p>{d.kicker}</p><div className="card-bottom"><span><Plane size={13}/>{flightDuration(origin,d.code)}</span><span>{d.mood[0]}</span></div></div>
        </article>)}</div>
        {!filtered.length&&<div className="empty-state"><Compass size={35}/><h3>A little too far off the map.</h3><p>Try another destination or give your filters a little room.</p><button className="primary-button" onClick={()=>{setQuery('');setMood('All escapes');setShortOnly(false);}}>Show all escapes <ArrowRight size={17}/></button></div>}
        <p className="estimates-note"><Info size={14}/>Flight durations are sourced examples from published schedules, checked October 27, 2026. They do not confirm service on your selected dates.</p>
      </section>
      <section className="closing-banner"><div className="closing-decoration"><Waves size={88} strokeWidth={.7}/></div><div><span className="eyebrow">A LITTLE DAYDREAMING GOES A LONG WAY</span><h2>Less tab-hopping.<br/><em>More island-hopping.</em></h2><p>Your flight, your stay, your way around. Bring it all together.</p></div><button className="light-button" onClick={()=>{if(active===origin)setActive('SJU');show('trip');}}>Put my trip together <ArrowUpRight size={19}/></button></section>
    </main>
    <footer><a href="#" className="wordmark"><Waves size={22}/>blue horizons.</a><p>An independent travel concept inspired by JetBlue.<br/>Not affiliated with JetBlue, Airbnb, Booking.com, or transport providers.</p><button onClick={()=>show('data')}>Data & travel notes <ArrowUpRight size={14}/></button><span>MADE FOR THE CURIOUS.</span></footer>
    {toast&&<div className="toast" role="status"><CheckCircle2 size={18}/>{toast}</div>}
    <dialog ref={dialog} onClose={()=>setModal(null)} onClick={e=>{if(e.target===dialog.current)close();}} className={`main-dialog ${modal==='trip'?'trip-dialog':''}`} aria-labelledby="dialog-title">
      <button className="dialog-close" onClick={close} aria-label="Close dialog"><X size={21}/></button>
      {modal==='trip'&&<div className="planner">
        <div className="planner-cover" style={{backgroundImage:`url("${current.image}")`}}><span className="eyebrow">YOUR NEXT CHAPTER</span><h2 id="dialog-title">Hello, <em>{current.city}.</em></h2><p>{current.country} · {current.code}</p></div>
        <div className="planner-content"><div className="planner-intro"><p>{current.description}</p><button className={`inline-save ${saved.includes(active)?'active':''}`} onClick={()=>toggleSave(active)}><Heart size={17} fill={saved.includes(active)?'currentColor':'none'}/>{saved.includes(active)?'Shortlisted':'Shortlist'}</button></div>
          <div className="trip-fields"><label>FROM<select value={origin} onChange={e=>changeOrigin(e.target.value as Origin)}>{origins.map(o=><option key={o} value={o}>{o} · {airport(o).city}</option>)}</select></label><label>DEPART<input type="date" min={ready?isoDay(1):undefined} max={ready?isoDay(365):undefined} value={checkin} onChange={e=>setCheckin(e.target.value)}/></label><label>RETURN<input type="date" min={checkin||undefined} value={checkout} onChange={e=>setCheckout(e.target.value)}/></label><label>ADULTS<select value={adults} onChange={e=>setAdults(Number(e.target.value))}>{[1,2,3,4,5,6].map(n=><option key={n}>{n}</option>)}</select></label></div>
          {!validTrip&&<p className="validation-message" role="status">Choose a departure after today, a later return within 90 nights, and a destination different from your departure airport.</p>}
          <div className="trip-snapshot"><span><CalendarDays size={16}/>Our suggested stay: {current.stay}</span><span><MapPin size={16}/>{current.neighborhood}</span></div>
          <div className="journey-heading"><span className="eyebrow">THE WHOLE TRIP, IN ONE PLACE</span><h3>From takeoff to <em>settling in.</em></h3></div>
          <div className="journey-block"><div className="journey-block-title"><span className="journey-icon"><Plane size={20}/></span><div><small>01 / GET THERE</small><h4>Your flight with JetBlue</h4></div><span className="status-pill">{schedules?.status==='live'?'Provider schedules':'Check with provider'}</span></div>
            <p>{origin} <ArrowRight size={13}/> {active} · {flightDuration(origin,active)}. Find fares and confirm your route on JetBlue.</p>
            <div className="provider-actions"><a className="primary-button small" href={links.jetblue} target="_blank" rel="noopener noreferrer">Find flights on JetBlue <ArrowUpRight size={16}/></a>{routeInfo(origin,active)&&<a className="text-button" href={routeInfo(origin,active)!.source} target="_blank" rel="noopener noreferrer">View published schedule source <ArrowUpRight size={15}/></a>}</div>{routeInfo(origin,active)&&<div className="provider-result"><p><Info size={15}/> {routeInfo(origin,active)!.flight} · {flightDuration(origin,active)}. {routeInfo(origin,active)!.effective}. Checked {routesChecked}. This is a reference example, not a schedule search for your selected date.</p></div>}
          </div>
          <div className="journey-block"><div className="journey-block-title"><span className="journey-icon"><BedDouble size={20}/></span><div><small>02 / MAKE YOURSELF AT HOME</small><h4>A stay that feels like you</h4></div></div><p>Start near {current.neighborhood}. Search with your dates and travelers; review all prices and terms on the provider site.</p>
            {validTrip?<div className="provider-links"><ProviderLink href={links.airbnb} name="airbnb" detail="Homes & places with personality" brand="airbnb"/><ProviderLink href={links.booking} name="Booking.com" detail="Hotels, apartments & more" brand="booking"/></div>:<p className="muted">Add valid trip dates to open stay searches.</p>}

          </div>
          <div className="journey-block"><div className="journey-block-title"><span className="journey-icon"><CarFront size={20}/></span><div><small>03 / GO YOUR OWN WAY</small><h4>A little freedom on four wheels</h4></div></div><p>Open a rental provider, then enter <b>{active} airport</b> and your pickup and return times. These links open provider homepages.</p><div className="provider-links compact"><ProviderLink href={links.hertz} name="Hertz" detail="Find a rental car" brand="hertz"/><ProviderLink href={links.enterprise} name="Enterprise" detail="Explore rental options" brand="enterprise"/><ProviderLink href={links.sixt} name="SIXT" detail="Choose your wheels" brand="sixt"/></div></div>
          <div className="journey-block"><div className="journey-block-title"><span className="journey-icon"><Navigation size={20}/></span><div><small>04 / THE LAST MILE</small><h4>Touch down. Head out.</h4></div></div><p>Uber opens with <b>{active} airport → {current.city} city center</b>. Change the destination to your stay before requesting a ride. Set both locations in Lyft. Service and airport pickup rules vary by location.</p><div className="provider-links"><ProviderLink href={links.uber} name="Uber" detail="Open airport-to-center ride" brand="uber"/><ProviderLink href={links.lyft} name="lyft" detail="Open Lyft · set your locations" brand="lyft"/></div><small className="muted">Rides are not scheduled for your travel dates. Request or schedule them in the provider app.</small></div>
          <div className="mini-guide"><Sparkles size={20}/><div><span className="eyebrow">LEAVE ROOM FOR THE GOOD STUFF</span><h3>A little inspiration for {current.city}.</h3><ol>{current.itinerary.map(x=><li key={x}>{x}</li>)}</ol><small>Editorial ideas, not a booked itinerary. Check local conditions and opening times.</small></div></div>
          <div className="planner-bottom"><button className="primary-button small" disabled={!validTrip} onClick={saveTrip}><Check size={16}/>Save trip on this device</button><button className="text-button" disabled={!validTrip} onClick={share}><Share2 size={16}/>Share trip</button><button className="text-button" disabled={!validTrip} onClick={exportTrip}><Download size={16}/>Download plan</button></div>
          {shareURL&&<label className="share-field">Your trip link<input readOnly value={shareURL} onFocus={e=>e.target.select()}/></label>}
          <p className="planner-note">Nothing has been booked. Flights, stays, cars, and rides are arranged and paid for separately with each provider. Links are ordinary outbound links, not affiliate partnerships.</p>
        </div>
      </div>}
      {(modal==='saved'||modal==='compare')&&<div className="simple-dialog"><span className="eyebrow">KEEP A LITTLE POSSIBILITY CLOSE</span><h2 id="dialog-title">Your <em>{modal==='compare'?'possibilities.':'shortlist.'}</em></h2><p>Up to three places you can’t stop thinking about. Saved on this device.</p>
        {!saved.length?<div className="empty-state"><Heart size={35}/><h3>Your next favorite is out there.</h3><p>Tap a heart on a destination to keep it here.</p><button className="primary-button" onClick={()=>{close();document.getElementById('explore')?.scrollIntoView({behavior:'smooth'});}}>Explore destinations <ArrowRight size={16}/></button></div>:<>
          <div className="saved-grid">{saved.map(code=>{const d=destinations.find(d=>d.code===code)!;return <article key={code}><div style={{backgroundImage:`url("${d.image}")`}} className="saved-image"><button className="save-button" onClick={()=>toggleSave(code)} aria-label={`Remove ${d.city}`}><X size={17}/></button></div><small>{d.country}</small><h3>{d.city}</h3><p>{d.kicker}</p><dl><div><dt>Suggested stay</dt><dd>{d.stay}</dd></div><div><dt>From {origin}</dt><dd>{code===origin?'Your departure city':flightDuration(origin,code)}</dd></div><div><dt>Explore</dt><dd>{d.mood.join(' · ')}</dd></div></dl><button className="primary-button small" disabled={code===origin} onClick={()=>plan(d)}>Plan this escape <ArrowUpRight size={16}/></button></article>;})}</div><p className="muted">Durations are published schedule examples. Review their effective periods and confirm your selected dates with JetBlue.</p>
        </>}
      </div>}
      {modal==='data'&&<div className="simple-dialog data-dialog"><span className="eyebrow">A CLEAR VIEW OF THE HORIZON</span><h2 id="dialog-title">A few <em>travel notes.</em></h2><p>Blue Horizons is an independent concept for discovering places and organizing your next trip.</p>
        <div className="source-item"><Globe2/><div><h3>Real coordinates. Sourced route examples.</h3><p>Airport names and coordinates come from <a href="https://ourairports.com/data/" target="_blank" rel="noopener noreferrer">OurAirports</a>, a public-domain dataset. Map geography uses <a href="https://github.com/topojson/world-atlas" target="_blank" rel="noopener noreferrer">World Atlas / Natural Earth</a>. Destination selection is curated using <a href="https://www.jetblue.com/en/find-flights" target="_blank" rel="noopener noreferrer">JetBlue’s destination listings</a> as a reference. Lines show only seven route examples checked against publicly published JetBlue schedules on October 27, 2026. Other destinations are shown without inferred connections. This is a limited snapshot, not a complete network or live availability.</p></div></div>
        <div className="source-item"><Plane/><div><h3>Schedules and estimates are different.</h3><p>Durations come from specific published JetBlue flight examples, with effective periods. They are not calculated or invented. Schedules change; confirm service for your dates with JetBlue. No live provider account is required for this reference dataset.</p></div></div>
        <div className="source-item"><CalendarDays/><div><h3>Published schedule references · October 27, 2026</h3><ul className="route-sources">{routes.map(r=><li key={r.origin+r.destination}><a href={r.source} target="_blank" rel="noopener noreferrer">{r.origin} → {r.destination} · {r.flight} · {Math.floor(r.minutes/60)}h {r.minutes%60}m</a><small>{r.effective}</small></li>)}</ul></div></div>
        <div className="source-item"><BedDouble/><div><h3>Provider searches, with a clear handoff.</h3><p>Airbnb and Booking.com links carry destination, dates, and adult count. Rental-car links open Hertz, Enterprise, and SIXT homepages for you to complete the search. Uber opens an airport-to-city-center route; Lyft opens its rider page. We do not promise local service or availability. No hotel listings, rental-car availability, ride quotes, or prices are fabricated or displayed. These are ordinary provider handoffs, not live inventory integrations.</p></div></div>
        <div className="source-item"><Heart/><div><h3>Your plan stays yours.</h3><p>Your shortlist and saved trip live in this browser. A share link contains destination, departure airport, dates, adult count, and country of residence. Anyone with the link can read those details. Provider searches send the trip details required for that search. No payment or passenger information is collected here.</p></div></div>
        <div className="source-item"><Info/><div><h3>Photography and independence.</h3><p>{photoNote} Travel suggestions are original editorial ideas. Photo file pages include the original attribution and license information. {Object.entries(photos).map(([code,p])=><span key={code}> <a href={p.credit} target="_blank" rel="noopener noreferrer">{code} photo & license</a> · </span>)} Blue Horizons is not affiliated with JetBlue or any listed provider. No booking, price comparison, or partner relationship is implied.</p></div></div>
      </div>}
    </dialog>
  </>;
}
