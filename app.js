const PARK_RADIUS_KM=1,FUEL_RADIUS_KM=10,OVERPASS='https://overpass-api.de/api/interpreter',API='https://gregorbuerger--6c96ef50bea611f1b1051607ee4eb77e.web.val.run/';
// Parkmodul 2.0 startet bewusst ohne Altzustand. Alte Parkplatz-Schluessel werden einmalig entfernt.
for(const k of Object.keys(localStorage)){if(k.startsWith('tp-parking-'))localStorage.removeItem(k)}
let mode=localStorage.getItem('tp-mode')||'all',fuel=localStorage.getItem('tp-fuel')||'e10',markers=[],selected=null,target=null,targetMarker=null,userMarker=null,searchTimer,fuelStations=[],fuelLoading=false,fuelError='',fuelRequestKey='',fuelFetchedAt=0,parkingItems=[],parkingLoading=false,parkingError='',parkingRequestKey='',parkingDiag={loaded:0,excluded:0,shown:0},parkingAbort=null,parkingSeq=0;
const map=new maplibregl.Map({container:'map',style:'https://tiles.openfreemap.org/styles/liberty',center:[10.235,47.965],zoom:11.1,attributionControl:true});
function km(a,b,c,d){const R=6371,p=Math.PI/180,x=(c-a)*p,y=(d-b)*p,q=Math.sin(x/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(q))}
function parkingKind(tags={}){const p=(tags.parking||'').toLowerCase();if(p==='multi-storey')return 'garage';if(p==='underground')return 'underground';if(tags.amenity==='parking_entrance'&&p==='multi-storey')return 'garage';if(tags.amenity==='parking_entrance'&&p==='underground')return 'underground';return 'parking'}
function parkingKindLabel(x){return x.kind==='garage'?'Parkhaus':x.kind==='underground'?'Tiefgarage':'Parkplatz'}
function parkingMarkerLabel(x){return 'P'}
function fullParkingAddress(x){const line=x.address||'';let city=x.city||'';let post=x.postCode||'';if(!city&&x.meta==='Memmingen'){city='Memmingen';post=post||'87700'}if(!city&&String(x.meta||'').startsWith('Ottobeuren')){city='Ottobeuren';post=post||'87724'}return [line,[post,city].filter(Boolean).join(' ')].filter(Boolean).join(' · ')}
function osmFee(tags={}){if(tags.fee==='no')return 'kostenlos';if(tags.fee==='yes')return tags.charge||'kostenpflichtig';return tags.charge||'Preis nicht bekannt'}
function osmHours(tags={}){return tags.opening_hours||null}
function osmParkingObject(e){
  const t=e.tags||{},lat=e.lat??e.center?.lat,lon=e.lon??e.center?.lon;
  if(!Number.isFinite(+lat)||!Number.isFinite(+lon))return null;
  const parkingTag=String(t.parking||'').toLowerCase();
  // Parkmodul 2.0: nur eindeutige Ausschlussgruende.
  if(['street_side','lane','on_street','on_kerb','half_on_kerb','shoulder','layby'].includes(parkingTag))return null;
  const accessTag=String(t.access||t.motor_vehicle||t.motorcar||'').toLowerCase();
  if(['private','no','customers'].includes(accessTag))return null;
  const kind=parkingKind(t),name=t.name||t.operator||parkingKindLabel({kind}),total=t.capacity?parseInt(t.capacity,10)||null:null;
  return{id:`osm-${e.type}-${e.id}`,osmType:e.type,osmId:e.id,type:'parking',kind,name,lat:+lat,lon:+lon,total,
    address:[t['addr:street'],t['addr:housenumber']].filter(Boolean).join(' ')||null,postCode:t['addr:postcode']||'',city:t['addr:city']||t['addr:place']||'',
    height:t.maxheight||null,hours:osmHours(t),fee:osmFee(t),fee2:t.maxstay?`Max. Parkdauer: ${t.maxstay}`:null,
    access:t.access||t.motor_vehicle||t.motorcar||'',operator:t.operator||'',source:'OpenStreetMap',sourceUrl:`https://www.openstreetmap.org/${e.type}/${e.id}`,
    parkingTag,isEntrance:t.amenity==='parking_entrance'}
}
function mergeParking(){return parkingItems}
function parkingPriority(x){if(x.kind==='garage'||x.kind==='underground')return 0;return 1}
function parkingData(){let a=mergeParking();if(target)a=a.map(x=>({...x,dist:km(target.lat,target.lon,x.lat,x.lon)})).filter(x=>x.dist<=PARK_RADIUS_KM);return a.sort((a,b)=>parkingPriority(a)-parkingPriority(b)||(a.dist??999)-(b.dist??999))}
const PARK_SOURCE='parking-v2-geojson',PARK_POINTS='parking-v2-symbol-bg',PARK_LABELS='parking-v2-symbol-labels';
function parkingGeoJSON(parks){return{type:'FeatureCollection',features:parks.filter(x=>Number.isFinite(+x.lon)&&Number.isFinite(+x.lat)).map(x=>({type:'Feature',geometry:{type:'Point',coordinates:[+x.lon,+x.lat]},properties:{id:x.id,kind:x.kind||'parking',selected:selected===x.id?1:0}}))}}
function ensureParkingMapLayers(){
  if(!map.isStyleLoaded())return false;
  try{
    if(!map.getSource(PARK_SOURCE))map.addSource(PARK_SOURCE,{type:'geojson',data:{type:'FeatureCollection',features:[]}});
    if(!map.getLayer(PARK_POINTS))map.addLayer({id:PARK_POINTS,type:'circle',source:PARK_SOURCE,paint:{
      'circle-radius':['case',['==',['get','selected'],1],14,11],
      'circle-color':['case',['==',['get','selected'],1],'#111827','#2563eb'],
      'circle-stroke-color':'#ffffff','circle-stroke-width':2,'circle-opacity':1
    }});
    if(!map.getLayer(PARK_LABELS))map.addLayer({id:PARK_LABELS,type:'symbol',source:PARK_SOURCE,layout:{
      'text-field':['case',['==',['get','kind'],'garage'],'P⌂',['==',['get','kind'],'underground'],'P↓','P'],
      'text-size':12,
      'text-font':['Noto Sans Regular'],
      'text-allow-overlap':true,
      'text-ignore-placement':true
    },paint:{'text-color':'#ffffff','text-halo-color':'rgba(0,0,0,0)','text-halo-width':0}});
    if(!map.__parkingV2Handlers){
      map.__parkingV2Handlers=true;
      map.on('click',PARK_POINTS,e=>{const f=e.features&&e.features[0];if(f?.properties?.id)selectParking(f.properties.id)});
      map.on('mouseenter',PARK_POINTS,()=>map.getCanvas().style.cursor='pointer');
      map.on('mouseleave',PARK_POINTS,()=>map.getCanvas().style.cursor='');
    }
    return true;
  }catch(err){console.error('Parkmodul 2.0 Punkt-Layerfehler',err);return false}
}
function updateParkingMapLayer(parks){
  if(!map.isStyleLoaded())return;
  if(!ensureParkingMapLayers())return;
  const src=map.getSource(PARK_SOURCE);
  if(src)src.setData(parkingGeoJSON(parks));
}
async function loadParking(force=false){
  if(mode==='fuel')return;
  if(!target){const c=map.getCenter();target={lat:c.lat,lon:c.lng,label:'Kartenmitte'}}
  const lat=+target.lat,lon=+target.lon,key=`${lat.toFixed(4)}:${lon.toFixed(4)}`;
  if(!force&&key===parkingRequestKey&&parkingItems.length)return;
  parkingRequestKey=key;if(parkingAbort)parkingAbort.abort();parkingAbort=new AbortController();const seq=++parkingSeq;
  parkingLoading=true;parkingError='';parkingDiag={loaded:0,excluded:0,shown:0};render();
  const q=`[out:json][timeout:20];(nwr["amenity"="parking"](around:${PARK_RADIUS_KM*1000},${lat},${lon});nwr["amenity"="parking_entrance"](around:${PARK_RADIUS_KM*1000},${lat},${lon}););out center tags;`;
  try{
    const r=await fetch(OVERPASS,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:'data='+encodeURIComponent(q),signal:parkingAbort.signal});
    if(!r.ok)throw new Error('OSM-Parkdaten nicht erreichbar');
    const j=await r.json();if(seq!==parkingSeq)return;
    const els=j.elements||[],mapped=els.map(osmParkingObject),items=mapped.filter(Boolean);
    parkingItems=items;parkingDiag={loaded:els.length,excluded:els.length-items.length,shown:items.length};parkingLoading=false;parkingError='';render();requestAnimationFrame(()=>updateParkingMapLayer(parkingData()));
  }catch(e){if(e?.name==='AbortError'||seq!==parkingSeq)return;parkingLoading=false;parkingError=e.message||'Parkdaten konnten nicht geladen werden.';render()}
}
function centerPoint(){if(target)return{lat:target.lat,lon:target.lon};const c=map.getCenter();return{lat:c.lat,lon:c.lng}}
function isOpen(x){if(!x.hours)return null;if(x.hours==='24/7')return true;const now=new Date(),mins=now.getHours()*60+now.getMinutes(),[a,b]=x.hours.split('–'),toM=s=>{const[h,m]=s.split(':').map(Number);return h*60+m},start=toM(a),end=toM(b);return end<start?(mins>=start||mins<end):(mins>=start&&mins<end)}
function hoursText(x){if(!x.hours)return '';return x.hours==='24/7'?'24 h geöffnet':`geöffnet ${x.hours} Uhr`}
function price(v){return typeof v==='number'?v.toFixed(3).replace('.',',')+' €':'–'}
function fuelName(){return fuel==='e5'?'E5':fuel==='diesel'?'Diesel':'E10'}
function fetchedText(){if(!fuelFetchedAt)return '';const d=new Date(fuelFetchedAt);return `Abgerufen ${d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})} Uhr`}
function accuracyCircle(lat,lon,meters){const pts=[],steps=64,earth=6378137;for(let i=0;i<=steps;i++){const a=2*Math.PI*i/steps,dy=Math.sin(a)*meters,dx=Math.cos(a)*meters,lat2=lat+(dy/earth)*180/Math.PI,lon2=lon+(dx/(earth*Math.cos(lat*Math.PI/180)))*180/Math.PI;pts.push([lon2,lat2])}return {type:'Feature',geometry:{type:'Polygon',coordinates:[pts]}}}
function showUserLocation(lat,lon,accuracy){if(userMarker)userMarker.remove();const el=document.createElement('div');el.className='user-location-dot';userMarker=new maplibregl.Marker({element:el}).setLngLat([lon,lat]).addTo(map);const data=accuracyCircle(lat,lon,Math.max(accuracy||20,10));if(map.getSource('user-accuracy'))map.getSource('user-accuracy').setData(data);else{map.addSource('user-accuracy',{type:'geojson',data});map.addLayer({id:'user-accuracy-fill',type:'fill',source:'user-accuracy',paint:{'fill-color':'#4f83ff','fill-opacity':0.12}});map.addLayer({id:'user-accuracy-line',type:'line',source:'user-accuracy',paint:{'line-color':'#4f83ff','line-opacity':0.35,'line-width':1}})}}
async function loadFuel(force=false){if(mode==='parking')return;const c=centerPoint(),key=`${c.lat.toFixed(3)}:${c.lon.toFixed(3)}:${fuel}`;if(!force&&key===fuelRequestKey&&Date.now()-fuelFetchedAt<60000)return;fuelRequestKey=key;fuelLoading=true;fuelError='';render();try{const u=new URL(API);u.searchParams.set('lat',c.lat);u.searchParams.set('lng',c.lon);u.searchParams.set('radius',FUEL_RADIUS_KM);u.searchParams.set('fuel',fuel);const r=await fetch(u,{cache:'no-store'});const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'Abfrage fehlgeschlagen');fuelStations=(j.stations||[]).map(x=>({...x,type:'fuel',lat:+x.lat,lon:+x.lng,dist:+x.distance,price:x.selectedPrice}));fuelFetchedAt=Date.now()}catch(e){fuelStations=[];fuelError=e.message||'Live-Daten konnten nicht geladen werden.'}finally{fuelLoading=false;render()}}
function render(){markers.forEach(m=>m.remove());markers=[];const parks=mode==='fuel'?[]:parkingData(),fuels=mode==='parking'?[]:[...fuelStations].sort((a,b)=>Number(b.isOpen)-Number(a.isOpen)||(a.distance??999)-(b.distance??999));let count=parks.length+fuels.length,label=mode==='fuel'?`${fuels.length} Tankstellen`:mode==='parking'?`${parks.length} ${parks.length===1?'Parkmöglichkeit':'Parkmöglichkeiten'}`:`${count} Ergebnisse`;
 document.getElementById('resultCount').textContent=label;document.getElementById('miniCount').textContent=label;const sub=mode==='fuel'?`${FUEL_RADIUS_KM} km · ${fuelName()}`:target?`Parken ${PARK_RADIUS_KM} km${mode==='all'?' · Tanken 10 km':''}`:'in der Kartenansicht';document.getElementById('dockSubtitle').textContent=sub;document.getElementById('areaText').textContent=' '+sub;const diag=document.getElementById('parkingDiag');if(diag){diag.textContent=mode==='fuel'?'':`Parkmodul 2.0 · OSM: ${parkingDiag.loaded} geladen · ${parkingDiag.excluded} Straßenparken ausgeschlossen · ${parks.length} angezeigt`;diag.style.display=mode==='fuel'?'none':'block'}const cards=document.getElementById('cards');cards.innerHTML='';
 updateParkingMapLayer(parks);
 parks.forEach(x=>{const d=x.dist!=null?` · ${x.dist<1?Math.round(x.dist*1000)+' m':x.dist.toFixed(1).replace('.',',')+' km'} zum Ziel`:'';const open=isOpen(x),status=open==null?'':`<span class="open-state ${open?'open':'closed'}">${open?'● Jetzt geöffnet':'● Jetzt geschlossen'}</span>`,details=[x.total?`${x.total} Stellplätze`:null,x.height?`Einfahrt ${x.height}`:null].filter(Boolean).join(' · ');const card=document.createElement('article');card.className='card'+(selected===x.id?' selected':'');card.innerHTML=`<div class="card-head"><div><div class="type">${parkingKindLabel(x)}</div><div class="name">${x.name}</div><div class="distance">${details}${d}</div></div></div>${status}<div class="parking-hours">${hoursText(x)}</div><div class="parking-fee"><strong>${x.fee}</strong>${x.fee2?`<span>${x.fee2}</span>`:''}</div><div class="meta">${fullParkingAddress(x)?fullParkingAddress(x)+' · ':''}${x.source}</div>${x.sourceUrl?`<a class="source-link" href="${x.sourceUrl}" target="_blank" rel="noopener noreferrer">Quelle: ${x.source} ↗</a>`:''}`;card.onclick=e=>{if(!e.target.closest('a'))selectParking(x.id)};cards.appendChild(card)});
 fuels.forEach(x=>{const el=document.createElement('div');const hasPrice=typeof x.price==='number';el.className='marker fuel-marker'+(!x.isOpen?' closed-fuel-marker':'')+(selected===x.id?' selected-marker':'');el.innerHTML=x.isOpen?(hasPrice?`<span>${price(x.price).replace(' €','')}</span><small>${fuelName()}</small>`:`<span class="pump-symbol">⛽</span><small>kein Preis</small>`):`<span class="closed-symbol">×</span><small>Zu</small>`;markers.push(new maplibregl.Marker({element:el}).setLngLat([x.lon,x.lat]).addTo(map));el.onclick=()=>selectFuel(x.id);const card=document.createElement('article');card.className='card fuel-card'+(selected===x.id?' selected':'');card.innerHTML=`<div class="card-head"><div><div class="type">⛽ ${fuelName()}</div><div class="name">${x.name}</div><div class="distance">${x.distance.toFixed(1).replace('.',',')} km · ${x.street||''} ${x.houseNumber||''}, ${x.place||''}</div></div>${x.isOpen?`<div class="fuel-price">${price(x.price)}<small>/l</small></div>`:'<div class="closed-card-label">ZU</div>'}</div><span class="open-state ${x.isOpen?'open':'closed'}">${x.isOpen?'● Geöffnet':'● Geschlossen'}</span><div class="meta">${fetchedText()}${fetchedText()?' · ':''}MTS-K über Tankerkönig · CC BY 4.0</div>`;card.onclick=()=>selectFuel(x.id);cards.appendChild(card)});
 if(parkingLoading&&mode!=='fuel')cards.insertAdjacentHTML('beforeend','<article class="card empty-card"><div class="type">🅿 OSM</div><div class="name">Parkmöglichkeiten werden geladen …</div></article>');if(parkingError&&mode!=='fuel')cards.insertAdjacentHTML('beforeend',`<article class="card empty-card"><div class="type">🅿 OSM</div><div class="name">Parkdaten derzeit nicht verfügbar</div><div class="meta">${parkingError}</div></article>`);if(fuelLoading&&mode!=='parking')cards.insertAdjacentHTML('beforeend','<article class="card empty-card"><div class="type">⛽ Live-Daten</div><div class="name">Tankstellen werden geladen …</div></article>');if(fuelError&&mode!=='parking')cards.insertAdjacentHTML('beforeend',`<article class="card empty-card"><div class="type">⛽ Live-Daten</div><div class="name">Tankstellen derzeit nicht verfügbar</div><div class="meta">${fuelError}</div></article>`);if(!cards.children.length&&!fuelLoading)cards.innerHTML='<article class="card empty-card"><div class="name">Keine Ergebnisse in diesem Bereich</div></article>'}
function navButtons(x){const pref=localStorage.getItem('tp-nav-app')||'';return `<div class="map-actions-title">In Karten ansehen</div><div class="nav-actions"><button class="nav-btn ${pref==='apple'?'preferred':''}" data-nav="apple"> Karten</button><button class="nav-btn ${pref==='google'?'preferred':''}" data-nav="google">Google Maps</button></div>`}
function openNavigation(kind,x){localStorage.setItem('tp-nav-app',kind);const lat=encodeURIComponent(x.lat),lon=encodeURIComponent(x.lon),label=encodeURIComponent(x.name||'Ziel');const url=kind==='google'?`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`:`https://maps.apple.com/?ll=${lat},${lon}&q=${label}`;window.location.href=url}
async function ensureParkingAddress(x){if(fullParkingAddress(x))return x;try{const u=`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${encodeURIComponent(x.lat)}&lon=${encodeURIComponent(x.lon)}`;const r=await fetch(u,{headers:{'Accept-Language':'de'}});if(!r.ok)return x;const j=await r.json(),a=j.address||{},street=a.road||a.pedestrian||a.residential||a.footway||'',house=a.house_number||'';x.address=[street,house].filter(Boolean).join(' ')||null;x.postCode=a.postcode||x.postCode||'';x.city=a.town||a.city||a.village||a.municipality||x.city||'';return x}catch{return x}}
function showParkingDetail(x){const d=x.dist!=null?(x.dist<1?Math.round(x.dist*1000)+' m zum Ziel':x.dist.toFixed(1).replace('.',',')+' km zum Ziel'):'',open=isOpen(x),details=[x.total?`${x.total} Stellplätze`:null,x.height?`Einfahrt ${x.height}`:null,d].filter(Boolean),box=document.getElementById('placeDetail'),addr=fullParkingAddress(x),access=x.access?`OSM-Zugang: ${x.access}`:'Zugang in OSM nicht genauer angegeben';box.className='place-detail';box.innerHTML=`<div class="detail-top"><div><div class="type">${parkingKindLabel(x).toUpperCase()}</div><div class="detail-title">${x.name}</div>${addr?`<div class="detail-address">${addr}</div>`:''}</div><button class="detail-close">×</button></div><div class="detail-row">${open==null?'':`<span class="pill ${open?'open':'closed'}">${open?'● Geöffnet':'● Geschlossen'}</span>`}${details.map(v=>`<span class="pill">${v}</span>`).join('')}</div><div class="detail-fee"><strong>${x.fee||''}</strong></div>${navButtons(x)}<div class="detail-extra">${hoursText(x)}${x.fee2?`<br>${x.fee2}`:''}<br>${access}${x.operator?` · Betreiber: ${x.operator}`:''}</div><div class="parking-check-note">⚠️ Parkbedingungen und Beschilderung vor Ort prüfen.</div><div class="detail-actions">${x.sourceUrl?`<a class="detail-source" href="${x.sourceUrl}" target="_blank" rel="noopener noreferrer">OSM-Objekt ansehen ↗</a>`:''}</div>`;bindDetail(box,x)}
function showFuelDetail(x){const box=document.getElementById('placeDetail'),addr=[x.street,x.houseNumber].filter(Boolean).join(' ')+' · '+[x.postCode,x.place].filter(Boolean).join(' ');box.className='place-detail';box.innerHTML=`<div class="detail-top"><div><div class="type">⛽ ${fuelName()}</div><div class="detail-title">${x.name}</div><div class="detail-sub">${addr}</div></div><button class="detail-close">×</button></div><div class="detail-row"><span class="pill ${x.isOpen?'open':'closed'}">${x.isOpen?'● Geöffnet':'● Geschlossen'}</span><span class="pill">${x.distance.toFixed(1).replace('.',',')} km</span></div>${x.isOpen?`<div class="detail-fuel-price">${price(x.price)} <small>/ Liter</small></div>`:'<div class="detail-closed">Tankstelle geschlossen</div>'}${navButtons(x)}<div class="detail-extra">${!x.isOpen?`Zuletzt gemeldete Preise:<br>`:''}E5: ${price(x.prices?.e5)}<br>E10: ${price(x.prices?.e10)}<br>Diesel: ${price(x.prices?.diesel)}<br><br>${fetchedText()}<br>Daten: MTS-K über Tankerkönig · CC BY 4.0 · ausschließlich Verbraucherinformation.</div><div class="detail-actions"><button class="detail-more">Details</button><a class="detail-source" href="https://creativecommons.tankerkoenig.de/" target="_blank" rel="noopener noreferrer">Tankerkönig ↗</a></div>`;bindDetail(box,x)}
function bindDetail(box,x){const close=box.querySelector('.detail-close');if(close)close.onclick=()=>{box.classList.add('hidden');selected=null;render()};const more=box.querySelector('.detail-more');if(more)more.onclick=()=>{box.classList.toggle('expanded');more.textContent=box.classList.contains('expanded')?'Weniger':'Details'};box.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>openNavigation(b.dataset.nav,x))}
function detailFreeViewport(){
  const mapEl=document.getElementById('map'),detail=document.getElementById('placeDetail');
  if(!mapEl||!detail||detail.classList.contains('hidden'))return null;
  const mr=mapEl.getBoundingClientRect(),dr=detail.getBoundingClientRect();
  const overlays=[document.querySelector('.topbar'),document.querySelector('.searchbox'),document.querySelector('.filterbar'),document.getElementById('searchHere')];
  let top=mr.top;
  for(const el of overlays){if(!el||el.classList.contains('hidden'))continue;const r=el.getBoundingClientRect();if(r.bottom>mr.top&&r.top<mr.bottom)top=Math.max(top,r.bottom)}
  const bottom=Math.min(mr.bottom,dr.top);
  if(bottom<=top+60)return null;
  return {x:mr.left+mr.width/2,y:top+(bottom-top)/2};
}
function positionSelectedInFreeMap(x,zoom){
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const free=detailFreeViewport();if(!free)return;
    const mapRect=document.getElementById('map').getBoundingClientRect();
    const mapCenter={x:mapRect.left+mapRect.width/2,y:mapRect.top+mapRect.height/2};
    map.jumpTo({center:[x.lon,x.lat],zoom});
    requestAnimationFrame(()=>{
      const dx=mapCenter.x-free.x,dy=mapCenter.y-free.y;
      map.panBy([dx,dy],{duration:420});
    });
  }));
}
function openSelectedDetail(x,type,zoom){
  selected=x.id;
  setSheet(true);
  render();
  const box=document.getElementById('placeDetail');
  box.classList.remove('hidden');
  if(type==='parking')showParkingDetail(x);else showFuelDetail(x);
  positionSelectedInFreeMap(x,zoom);
}
function selectParking(id){const x=parkingData().find(v=>v.id===id)||mergeParking().find(v=>v.id===id);if(!x)return;openSelectedDetail(x,'parking',15)}
function selectFuel(id){const x=fuelStations.find(v=>v.id===id);if(!x)return;openSelectedDetail(x,'fuel',14.5)}
function setTarget(t){selected=null;document.getElementById('placeDetail').classList.add('hidden');setSheet(true);target=t;if(targetMarker)targetMarker.remove();const el=document.createElement('div');el.className='target-marker';el.textContent='⌖';targetMarker=new maplibregl.Marker({element:el}).setLngLat([t.lon,t.lat]).addTo(map);document.getElementById('targetInfo').classList.remove('hidden');document.getElementById('targetInfo').innerHTML=`<strong>Ziel</strong><span>${t.label} · Parken ${PARK_RADIUS_KM} km · Tanken ${FUEL_RADIUS_KM} km</span>`;map.flyTo({center:[t.lon,t.lat],zoom:14});render();loadParking(true);loadFuel(true)}
async function geocode(q){const u=`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=12&countrycodes=de&q=${encodeURIComponent(q)}`,r=await fetch(u,{headers:{'Accept-Language':'de'}});if(!r.ok)throw Error();return normalizeSuggestions(await r.json())}
function suggestionParts(v){const a=v.address||{},road=a.road||a.pedestrian||a.residential||a.path||'',house=a.house_number||'',city=a.town||a.city||a.village||a.municipality||a.county||'',postcode=a.postcode||'';let title=[road,house].filter(Boolean).join(' ').trim();if(!title)title=(v.name||v.display_name.split(',')[0]||'Adresse').trim();let subtitle=[postcode,city].filter(Boolean).join(' ').trim();return{title,subtitle}}
function normalizeSuggestions(list){const out=[];for(const v of list){const p=suggestionParts(v),lat=+v.lat,lon=+v.lon,same=out.some(x=>{const xp=suggestionParts(x),sameLabel=(xp.title+'|'+xp.subtitle).toLowerCase()===(p.title+'|'+p.subtitle).toLowerCase(),near=Math.abs(+x.lat-lat)<.00045&&Math.abs(+x.lon-lon)<.00065;return sameLabel||near});if(!same)out.push(v);if(out.length===4)break}return out}
function closeSuggestions(){const s=document.getElementById('suggestions');s.replaceChildren();s.style.display='none';s.setAttribute('aria-hidden','true');endSearch()}
function showSuggestions(list){const s=document.getElementById('suggestions');s.replaceChildren();if(!list.length){s.style.display='none';s.setAttribute('aria-hidden','true');return}s.style.display='';s.setAttribute('aria-hidden','false');list.forEach(v=>{const p=suggestionParts(v),b=document.createElement('button');b.type='button';b.innerHTML=`<strong>${p.title}</strong>${p.subtitle?`<small>${p.subtitle}</small>`:''}`;b.onclick=()=>{addressInput.value=p.title;closeSuggestions();setTarget({lat:+v.lat,lon:+v.lon,label:[p.title,p.subtitle].filter(Boolean).join(', ')})};s.appendChild(b)})}
const addressInput=document.getElementById('addressInput');addressInput.addEventListener('focus',()=>{document.body.classList.add('search-active');document.querySelector('.searchbox').classList.add('searching')});function endSearch(){document.body.classList.remove('search-active');document.querySelector('.searchbox').classList.remove('searching');addressInput.blur()}
addressInput.addEventListener('input',e=>{clearTimeout(searchTimer);const q=e.target.value.trim();if(q.length<3){showSuggestions([]);return}searchTimer=setTimeout(async()=>{try{showSuggestions(await geocode(q))}catch{}},650)});document.getElementById('addressForm').onsubmit=async e=>{e.preventDefault();const q=addressInput.value.trim();if(q)try{const a=await geocode(q);if(a[0]){const p=suggestionParts(a[0]);closeSuggestions();setTarget({lat:+a[0].lat,lon:+a[0].lon,label:[p.title,p.subtitle].filter(Boolean).join(', ')})}}catch{}};
document.getElementById('clearSearch').onclick=()=>{addressInput.value='';showSuggestions([]);target=null;if(targetMarker)targetMarker.remove();targetMarker=null;document.getElementById('targetInfo').classList.add('hidden');render();loadParking(true);loadFuel(true)};
document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');mode=b.dataset.mode;localStorage.setItem('tp-mode',mode);document.getElementById('fuelFilter').style.display=mode==='fuel'?'flex':'none';selected=null;document.getElementById('placeDetail').classList.add('hidden');render();if(mode!=='fuel')loadParking();if(mode!=='parking')loadFuel()});document.querySelectorAll('.fuel-chip').forEach(b=>b.onclick=()=>{document.querySelectorAll('.fuel-chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');fuel=b.dataset.fuel;localStorage.setItem('tp-fuel',fuel);fuelRequestKey='';render();loadFuel(true)});
function restorePrefs(){document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));document.getElementById('fuelFilter').style.display=mode==='fuel'?'flex':'none';document.querySelectorAll('.fuel-chip').forEach(b=>b.classList.toggle('active',b.dataset.fuel===fuel))}restorePrefs();
const sheetContent=document.getElementById('sheetContent'),sheetMini=document.getElementById('sheetMini'),sheetToggle=document.getElementById('sheetToggle');function setSheet(minimized){sheetContent.classList.toggle('hidden',minimized);sheetMini.classList.toggle('hidden',!minimized);if(!minimized){document.getElementById('placeDetail').classList.add('hidden');selected=null;render()}}sheetToggle.onclick=()=>setSheet(true);sheetMini.onclick=()=>setSheet(false);
const sh=document.getElementById('searchHere');map.on('dragend',()=>sh.classList.add('visible'));sh.onclick=()=>{sh.classList.remove('visible');const c=map.getCenter();target={lat:c.lat,lon:c.lng,label:'Kartenmitte'};if(targetMarker)targetMarker.remove();targetMarker=null;document.getElementById('targetInfo').classList.remove('hidden');document.getElementById('targetInfo').innerHTML=`<strong>Kartenbereich</strong><span>Parken ${PARK_RADIUS_KM} km · Tanken ${FUEL_RADIUS_KM} km</span>`;parkingRequestKey='';fuelRequestKey='';render();loadParking(true);loadFuel(true)};document.getElementById('locateBtn').onclick=()=>navigator.geolocation?.getCurrentPosition(p=>{selected=null;target={lat:p.coords.latitude,lon:p.coords.longitude,label:'Mein Standort'};document.getElementById('placeDetail').classList.add('hidden');setSheet(true);if(targetMarker)targetMarker.remove();targetMarker=null;showUserLocation(p.coords.latitude,p.coords.longitude,p.coords.accuracy);document.getElementById('targetInfo').classList.remove('hidden');document.getElementById('targetInfo').innerHTML=`<strong>Mein Standort</strong><span>Parken ${PARK_RADIUS_KM} km · Tanken ${FUEL_RADIUS_KM} km · Genauigkeit ca. ${Math.round(p.coords.accuracy||0)} m</span>`;map.flyTo({center:[target.lon,target.lat],zoom:14});render();loadParking(true);loadFuel(true)},()=>alert('Standort konnte nicht ermittelt werden.'),{enableHighAccuracy:true,timeout:10000,maximumAge:30000});
map.on('load',()=>{const c=map.getCenter();if(!target)target={lat:c.lat,lon:c.lng,label:'Kartenmitte'};render();requestAnimationFrame(()=>{ensureParkingMapLayers();updateParkingMapLayer(parkingData())});if(mode!=='fuel')loadParking(true);if(mode!=='parking')loadFuel()});
function showInfo(){const box=document.getElementById('placeDetail');box.className='place-detail expanded';box.innerHTML=`<div class="detail-top"><div><div class="type">INFO</div><div class="detail-title">Datenquellen</div></div><button class="detail-close">×</button></div><div class="info-copy"><strong>Kraftstoffpreise & Tankstellen</strong><br>MTS-K, bereitgestellt über Tankerkönig · CC BY 4.0. Verwendung ausschließlich zur Verbraucherinformation.<br><a href="https://creativecommons.tankerkoenig.de/" target="_blank" rel="noopener noreferrer">Tankerkönig ↗</a><br><br><strong>Parkplätze</strong><br>Deutschlandweite Basis: OpenStreetMap. Vorhandene Angaben zu Typ, Kapazität, Gebühren und Öffnungszeiten werden übernommen. Parkmodul 2.0 zeigt die geladenen OSM-Parkanlagen weitgehend unverfälscht. In dieser Basisversion wird nur explizites Straßenparken ausgeblendet. Parkbedingungen und Beschilderung bitte vor Ort prüfen.<br><br><strong>Karte</strong><br>OpenFreeMap / OpenStreetMap.</div>`;box.querySelector('.detail-close').onclick=()=>box.classList.add('hidden')}
document.getElementById('infoBtn').onclick=showInfo;
async function checkForUpdate(manual=false){const status=document.getElementById('updateStatus');if(manual){status.textContent='Suche nach Update …';status.classList.remove('hidden')}try{if(!('serviceWorker'in navigator))return;const reg=await navigator.serviceWorker.getRegistration()||await navigator.serviceWorker.register('./sw.js?v=5.2',{updateViaCache:'none'});await reg.update();if(manual){status.textContent='v5.2 ist aktuell.';setTimeout(()=>status.classList.add('hidden'),2200)}}catch{if(manual)status.textContent='Updateprüfung fehlgeschlagen.'}}document.getElementById('updateBtn').onclick=()=>checkForUpdate(true);if('serviceWorker'in navigator){navigator.serviceWorker.register('./sw.js?v=5.2',{updateViaCache:'none'}).then(reg=>{reg.update();setInterval(()=>reg.update(),30*60*1000)});navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!window.__reloading){window.__reloading=true;location.reload()}})}
