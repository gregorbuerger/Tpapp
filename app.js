const DEMO = [
 {id:'f1',type:'fuel',name:'Aral',lat:47.9898,lon:10.1712,e10:1.669,e5:1.729,diesel:1.589,meta:'Geöffnet · Memmingen'},
 {id:'f2',type:'fuel',name:'JET',lat:47.9818,lon:10.1819,e10:1.649,e5:1.709,diesel:1.569,meta:'Geöffnet · 24 h'},
 {id:'f3',type:'fuel',name:'AVIA',lat:48.0005,lon:10.1908,e10:1.679,e5:1.739,diesel:1.599,meta:'Geöffnet'},
 {id:'f4',type:'fuel',name:'Esso',lat:47.9739,lon:10.1658,e10:1.659,e5:1.719,diesel:1.579,meta:'Geöffnet'},
 {id:'p1',type:'parking',name:'Parkhaus Innenstadt',lat:47.9867,lon:10.1800,free:127,total:320,live:true,meta:'Live · gebührenpflichtig'},
 {id:'p2',type:'parking',name:'Parkplatz Bahnhof',lat:47.9853,lon:10.1872,free:42,total:110,live:true,meta:'Live · P+R'},
 {id:'p3',type:'parking',name:'Parkplatz Stadthalle',lat:47.9912,lon:10.1773,free:null,total:95,live:false,meta:'Kapazität 95 · keine Live-Daten'}
];
let mode='all', fuel='e10', markers=[], selected=null;
const map = new maplibregl.Map({container:'map',style:'https://tiles.openfreemap.org/styles/liberty',center:[10.181,47.987],zoom:13.4,attributionControl:false});
map.addControl(new maplibregl.NavigationControl({showCompass:false}),'bottom-right');

function visibleData(){return DEMO.filter(x=>mode==='all'||x.type===mode)}
function priceText(x){return x[fuel].toFixed(3).replace('.',',')}
function render(){
 markers.forEach(m=>m.remove()); markers=[];
 const data=visibleData(); document.getElementById('resultCount').textContent=`${data.length} Orte`;
 const cards=document.getElementById('cards'); cards.innerHTML='';
 data.forEach(x=>{
   const el=document.createElement('div'); el.className=`marker ${x.type} ${x.live?'live':''}`; el.textContent=x.type==='fuel'?priceText(x):'P';
   const m=new maplibregl.Marker({element:el}).setLngLat([x.lon,x.lat]).addTo(map); markers.push(m);
   el.onclick=()=>select(x.id,true);
   const card=document.createElement('article'); card.className='card'+(selected===x.id?' selected':''); card.dataset.id=x.id;
   card.innerHTML=x.type==='fuel'?`<div class="card-head"><div><div class="type">⛽ Tankstelle</div><div class="name">${x.name}</div><div class="distance">${fuel.toUpperCase()}</div></div><div class="price">${priceText(x)} €<small>/l</small></div></div><div class="meta">${x.meta}</div>`:`<div class="card-head"><div><div class="type">🅿 Parken</div><div class="name">${x.name}</div><div class="distance">${x.total} Plätze gesamt</div></div><div class="availability">${x.free===null?'–':x.free}<small>${x.free===null?'':' frei'}</small></div></div><div class="meta">${x.meta}</div>`;
   card.onclick=()=>select(x.id,false); cards.appendChild(card);
 });
}
function select(id,scroll){selected=id; const x=DEMO.find(v=>v.id===id); map.easeTo({center:[x.lon,x.lat],zoom:15,duration:500}); render(); if(scroll) setTimeout(()=>document.querySelector(`.card[data-id="${id}"]`)?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'}),50)}

document.querySelectorAll('.seg').forEach(b=>b.onclick=()=>{document.querySelectorAll('.seg').forEach(x=>x.classList.remove('active'));b.classList.add('active');mode=b.dataset.mode;document.getElementById('fuelFilter').style.display=mode==='parking'?'none':'flex';selected=null;render()});
document.querySelectorAll('.fuel-chip').forEach(b=>b.onclick=()=>{document.querySelectorAll('.fuel-chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');fuel=b.dataset.fuel;render()});
const searchHere=document.getElementById('searchHere'); map.on('dragend',()=>searchHere.classList.add('visible')); searchHere.onclick=()=>{searchHere.classList.remove('visible');render()};
document.getElementById('locateBtn').onclick=()=>navigator.geolocation?.getCurrentPosition(p=>map.flyTo({center:[p.coords.longitude,p.coords.latitude],zoom:14}),()=>alert('Standort konnte nicht ermittelt werden.'));
map.on('load',render);
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
