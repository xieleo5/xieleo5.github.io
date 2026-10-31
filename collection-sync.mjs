const API='https://gfg-api.duckdns.org/homepage-api';
const TOKEN_KEY='yuqi-visitor-token-v1';
const QUEUE_KEY='yuqi-collection-upload-v1';

// The token is an anonymous browser credential, never included in diagnostics.
export function startCollectionSync({win=window,storage=localStorage,request=fetch,cryptoAPI=crypto,api=API}={}){
 const read=(key,fallback)=>{try{return JSON.parse(storage.getItem(key))??fallback;}catch{return fallback;}};
 const write=(key,value)=>{try{storage.setItem(key,JSON.stringify(value));}catch{}};
 let token=read(TOKEN_KEY,null);
 if(!/^[a-f0-9]{64}$/.test(token||'')){
  token=Array.from(cryptoAPI.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');write(TOKEN_KEY,token);
 }
 const eventId=cryptoAPI.randomUUID();
 let visitPending=true,loaded=false,running=false,timer=null,delay=2000,stopped=false;
 let queue=read(QUEUE_KEY,{});
 if(!queue||typeof queue!=='object'||Array.isArray(queue))queue={};
 const collection=win.PokemonCollection;
 const allowed=new Set([...collection.list(),...collection.cats()].map(p=>p.id));
 queue=Object.fromEntries(Object.entries(queue).filter(([id,item])=>allowed.has(id)&&item?.pokemonId===id));
 function saveQueue(){write(QUEUE_KEY,queue);}
 function importLocal(){
  for(const id of allowed)if(collection.has(id)&&!queue[id])queue[id]={pokemonId:id,source:'legacy',obtainedAt:null};
  saveQueue();
 }
 importLocal();
 async function call(path,method='GET',data){
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);
  try{
   const response=await request(api+path,{method,headers:{Authorization:'Bearer '+token,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined,signal:controller.signal,credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});
   if(!response.ok)throw new Error('Collection service unavailable');
   return await response.json();
  }finally{clearTimeout(timeout);}
 }
 function schedule(ms=250){if(stopped)return;clearTimeout(timer);timer=setTimeout(flush,ms);}
 async function flush(){
  if(running||stopped)return;
  clearTimeout(timer);running=true;let failed=false;
  // A visit failure must not prevent collection recovery, or vice versa.
  if(visitPending)try{await call('/visit','POST',{eventId});visitPending=false;}catch{failed=true;}
  try{
   if(!loaded){
    const remote=await call('/collection');
    const ids=remote.items.map(item=>item.pokemonId).filter(id=>allowed.has(id));
    collection.merge(ids);
    for(const id of ids)delete queue[id];
    loaded=true;saveQueue();
   }
   const batch=Object.values(queue);
   if(batch.length){
    await call('/collection','PUT',{items:batch});
    // New awards can arrive while a request is in flight.
    for(const item of batch)if(queue[item.pokemonId]===item)delete queue[item.pokemonId];
    saveQueue();
   }
  }catch{failed=true;}
  running=false;
  if(failed){schedule(delay);delay=Math.min(delay*2,120000);}else{delay=2000;if(Object.keys(queue).length)schedule();}
 }
 function changed(event){
  const {id,source,fresh}=event.detail||{};
  if(!allowed.has(id)||!fresh||source==='cloud')return;
  queue[id]={pokemonId:id,source:['guess','arm','battle'].includes(source)?source:'unknown',obtainedAt:new Date().toISOString()};
  saveQueue();schedule();
 }
 function online(){schedule(0);}
 function visible(){if(win.document.visibilityState==='visible')schedule(0);}
 win.addEventListener('pokemon-collection-change',changed);
 win.addEventListener('online',online);
 win.document.addEventListener('visibilitychange',visible);
 schedule(0);
 return {flush,stop(){stopped=true;clearTimeout(timer);win.removeEventListener('pokemon-collection-change',changed);win.removeEventListener('online',online);win.document.removeEventListener('visibilitychange',visible);}};
}

if(typeof window!=='undefined'&&window.location.hostname==='xieleo5.github.io'){
 const start=()=>{try{startCollectionSync();}catch{/* Local play is available even when browser storage is disabled. */}};
 if(window.PokemonCollection)start();else window.addEventListener('pokemon-ready',start,{once:true});
}
